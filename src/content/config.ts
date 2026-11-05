import { defineCollection, z } from 'astro:content';

const baseSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  draft: z.boolean().default(false),
  image: z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
});

const blog = defineCollection({
  type: 'content',
  schema: baseSchema.extend({
    description: z.string().optional(),
  }),
});

const art = defineCollection({
  type: 'content',
  schema: baseSchema.extend({
    image: z.string(),
  }),
});

const books = defineCollection({
  type: 'content',
  schema: baseSchema.extend({
    rating: z.preprocess(
      (val) => (val === '' || val === null ? undefined : val),
      z.number().min(1).max(5).optional(),
    ),
  }),
});

const games = defineCollection({
  type: 'content',
  schema: baseSchema.extend({
    rating: z.preprocess(
      (val) => (val === '' || val === null ? undefined : val),
      z.number().min(1).max(5).optional(),
    ),
  }),
});

export const collections = { blog, art, books, games };
