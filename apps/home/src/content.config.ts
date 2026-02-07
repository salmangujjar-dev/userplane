import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    category: z.string(),
    date: z.coerce.date(),
    author: z.string(),
  }),
});

const legal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    lastUpdated: z.coerce.date(),
  }),
});

const support = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/support' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    order: z.number().default(0),
  }),
});

export const collections = { blog, legal, support };
