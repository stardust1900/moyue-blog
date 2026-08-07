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

// 书籍集合：每个章节 md 作为一条 entry，id 形如 "书名/章节名/内容"
// 书籍元信息（书名/作者/封面）由同目录下的 book.json 提供，通过 utils/books.ts 读取
const books = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/books' }),
  schema: z.object({}),
});

export const collections = { posts, books };
