import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';

export type SiteCollection = 'blog' | 'art' | 'reading' | 'games';
export type StandardCollection = Exclude<SiteCollection, 'art'>;
export type SiteEntry = CollectionEntry<SiteCollection>;

export interface ContentCardModel {
  href: string;
  title: string;
  date: Date;
  image?: string;
  statusLabel?: string;
  actionLabel: string;
  rating?: number;
  description?: string;
}

export type ContentCardVariant = 'standard' | 'art';

export interface CollectionDescriptor {
  label: string;
  cardVariant: ContentCardVariant;
  actionLabel: string;
  showReadingStatus?: boolean;
  detail: ContentDetailModel;
}

export interface ContentDetailModel {
  collectionLabel: string;
  rating?: number;
  heroImage: boolean;
  bodyImage: boolean;
}

export const collectionDescriptors: Record<SiteCollection, CollectionDescriptor> = {
  blog: {
    label: 'Blog',
    cardVariant: 'standard',
    actionLabel: 'Read Review →',
    detail: { collectionLabel: 'blog', heroImage: true, bodyImage: false },
  },
  art: {
    label: 'Art',
    cardVariant: 'art',
    actionLabel: 'View Artwork →',
    detail: { collectionLabel: 'art', heroImage: false, bodyImage: false },
  },
  reading: {
    label: 'Reading',
    cardVariant: 'standard',
    actionLabel: 'View Progress →',
    showReadingStatus: true,
    detail: { collectionLabel: 'reading', heroImage: false, bodyImage: true },
  },
  games: {
    label: 'Games',
    cardVariant: 'standard',
    actionLabel: 'View Progress →',
    detail: { collectionLabel: 'games', heroImage: true, bodyImage: false },
  },
};

export function isPublished(entry: SiteEntry, isProduction: boolean) {
  return !isProduction || !entry.data.draft;
}

export function getSiteCollectionEntries<T extends SiteCollection>(collection: T) {
  return getCollection(collection);
}

export async function getSiteCollectionPaths<T extends SiteCollection>(collection: T) {
  const entries = await getSiteCollectionEntries(collection);

  return entries.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
}

export function getEntryHref(collection: SiteCollection, slug: string) {
  return `/${collection}/${slug}`;
}

export function getContentCardModel(
  entry: SiteEntry,
  collection: SiteCollection,
): ContentCardModel {
  const rating = 'rating' in entry.data ? entry.data.rating : undefined;
  const dateFinished =
    'dateFinished' in entry.data ? entry.data.dateFinished : undefined;
  const descriptor = collectionDescriptors[collection];

  return {
    href: getEntryHref(collection, entry.slug),
    title: entry.data.title,
    date: dateFinished ?? entry.data.date,
    image: entry.data.image,
    statusLabel:
      descriptor.showReadingStatus && !dateFinished ? 'Reading' : undefined,
    actionLabel: dateFinished ? 'Read Review →' : descriptor.actionLabel,
    rating: dateFinished ? rating : undefined,
    description: entry.data.description,
  };
}

export function getContentDetailModel(
  entry: SiteEntry,
  collection: SiteCollection,
): ContentDetailModel {
  const descriptor = collectionDescriptors[collection];
  return {
    ...descriptor.detail,
    collectionLabel: descriptor.label,
    rating:
      collection === 'reading' && 'rating' in entry.data
        ? entry.data.rating
        : undefined,
  };
}

export function sortByDate<T extends { data: { date: Date } }>(entries: T[]) {
  return [...entries].sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
}

export function isSiteCollection(
  collection: CollectionKey,
): collection is SiteCollection {
  return ['blog', 'art', 'reading', 'games'].includes(collection);
}
