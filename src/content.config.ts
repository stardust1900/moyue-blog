import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Astro 5 内容合集（类 Jekyll 的 _posts）：文件采用 YYYY-MM-DD-slug.md 命名
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    description: z.string(),
    coverEmoji: z.string().default('📝'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
