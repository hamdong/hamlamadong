import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date().transform((val) => new Date(val)),
    description: z.string().optional(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default(['Journal']),
    image: z
      .string()
      .optional()
      .transform((val) => (val === '' ? undefined : val)),
  }),
});

export const collections = { blog };
