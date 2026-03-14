import { defineCollection, z } from 'astro:content';

const baseSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  description: z.string().optional(),
  draft: z.boolean().default(false),
  image: z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
});

const blog = defineCollection({
  type: 'content',
  schema: baseSchema.extend({
    tags: z.array(z.string()).default(['Journal']),
  }),
});

const reading = defineCollection({
  type: 'content',
  schema: baseSchema.extend({
    dateFinished: z.preprocess(
      (val) => (val === '' || val === null ? undefined : val),
      z.coerce.date().optional(),
    ),
    rating: z.preprocess(
      (val) => (val === '' || val === null ? undefined : val),
      z.number().min(1).max(5).optional(),
    ),
  }),
});

export const collections = { blog, reading };
