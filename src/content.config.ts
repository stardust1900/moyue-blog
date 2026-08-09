import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { notebookLoader } from './loaders/notebook-loader';

// posts 与 notebooks 共用的元信息 schema（与 PostLayout / utils/posts 字段对齐）
// bodyHtml / headings / plain 为 notebook 专用扩展字段，posts 不需要，故设为可选。
const postSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  description: z.string(),
  coverEmoji: z.string().default('📝'),
  draft: z.boolean().default(false),
  // —— 以下为 notebook 专用（markdown 文章无需提供）——
  bodyHtml: z.string().optional(),
  headings: z
    .array(z.object({ depth: z.number(), slug: z.string(), text: z.string() }))
    .optional(),
  plain: z.string().optional(),
});

// Astro 5 内容合集（类 Jekyll 的 _posts）：文件采用 YYYY-MM-DD-slug.md 命名
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: postSchema,
});

// Jupyter notebook 合集：文件采用 YYYY-MM-DD-slug.ipynb 命名，由自定义 Loader 解析渲染
const notebooks = defineCollection({
  loader: notebookLoader(),
  schema: postSchema,
});

// 书籍集合：每个章节 md 作为一条 entry，id 形如 "书名/章节名/内容"
// 书籍元信息（书名/作者/封面）由同目录下的 book.json 提供，通过 utils/books.ts 读取
const books = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/books' }),
  schema: z.object({}),
});

export const collections = { posts, notebooks, books };
