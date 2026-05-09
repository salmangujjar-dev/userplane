import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { z } from 'astro:schema';

const blogDir = fileURLToPath(new URL('./content/blog', import.meta.url));

function hasMarkdownFiles(dir: string): boolean {
  if (!existsSync(dir)) return false;

  return readdirSync(dir, { withFileTypes: true }).some((entry) => {
    if (entry.isDirectory()) return hasMarkdownFiles(`${dir}/${entry.name}`);
    return entry.isFile() && /\.md$/.test(entry.name);
  });
}

const blog = defineCollection({
  loader: hasMarkdownFiles(blogDir)
    ? glob({ pattern: '**/*.md', base: './src/content/blog' })
    : { name: 'empty-blog-loader', load: async () => {} },
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

export const collections = { blog, legal };
