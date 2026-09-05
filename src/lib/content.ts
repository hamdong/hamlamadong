import type { CollectionEntry, CollectionKey } from 'astro:content';

export type SiteCollection = 'blog' | 'art' | 'reading' | 'games';
export type SiteEntry = CollectionEntry<SiteCollection>;

export interface ContentCardModel {
  href: string;
  title: string;
  date: Date;
  image?: string;
  tags: string[];
  variant: 'standard' | 'art';
  statusLabel?: string;
  actionLabel: string;
  rating?: number;
  description?: string;
}

export interface ContentDetailModel {
  collectionLabel: string;
  tags: string[];
  rating?: number;
  heroImage: boolean;
  bodyImage: boolean;
}

export function isPublished(entry: SiteEntry, isProduction: boolean) {
  return !isProduction || !entry.data.draft;
}

export function getEntryHref(collection: SiteCollection, slug: string) {
  return `/${collection}/${slug}`;
}

export function getTags(entry: SiteEntry) {
  return 'tags' in entry.data ? entry.data.tags : [];
}

export function getContentCardModel(
  entry: SiteEntry,
  collection: SiteCollection,
): ContentCardModel {
  const tags = getTags(entry);
  const rating = 'rating' in entry.data ? entry.data.rating : undefined;
  const dateFinished =
    'dateFinished' in entry.data ? entry.data.dateFinished : undefined;
  const isReading = collection === 'reading';
  const isArt = collection === 'art';

  return {
    href: getEntryHref(collection, entry.slug),
    title: entry.data.title,
    date: dateFinished ?? entry.data.date,
    image: entry.data.image,
    tags,
    variant: isArt ? 'art' : 'standard',
    statusLabel: isReading && !dateFinished ? 'Reading' : undefined,
    actionLabel: isArt
      ? 'View Artwork →'
      : dateFinished || collection === 'blog'
        ? 'Read Review →'
        : 'View Progress →',
    rating: dateFinished ? rating : undefined,
    description: entry.data.description,
  };
}

export function getContentDetailModel(
  entry: SiteEntry,
  collection: SiteCollection,
): ContentDetailModel {
  const isReading = collection === 'reading';

  return {
    collectionLabel: collection,
    tags: getTags(entry),
    rating: collection === 'reading' ? entry.data.rating : undefined,
    heroImage: !isReading,
    bodyImage: isReading,
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
