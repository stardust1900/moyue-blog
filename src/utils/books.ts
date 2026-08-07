// 书籍模块数据层：基于 content collection「books」扫描 src/content/books。
// 每个章节 md 作为一条集合 entry，id 形如 "书名/章节名/内容"。
// 书籍元信息（书名/作者/封面）由书名目录下的 book.json 提供，封面图片同目录。
import { getCollection, type CollectionEntry } from 'astro:content';

export interface BookChapter {
  slug: string; // 章节 slug（目录名，URL 安全）
  title: string; // 章节名（目录名）
  id: string; // 集合 entry id，用于 getEntry 渲染
}

export interface BookMeta {
  title: string;
  author: string;
  cover: string; // 封面文件名，如 cover.svg
  chapters?: { slug: string; title?: string }[]; // 有序章节列表定义（可选）
}

export interface Book {
  slug: string; // 书名（目录名，URL 安全）
  title: string;
  author: string;
  cover: string | null; // 封面资源 URL，无则 null
  chapters: BookChapter[];
  metaChapters?: { slug: string; title?: string }[]; // book.json 中定义的有序章节列表
}

// 扫描所有 book.json（构建期静态）；eager 模式下每个模块为 { default: BookMeta }
const metaModules = import.meta.glob('../content/books/**/book.json', {
  eager: true,
}) as Record<string, { default: BookMeta }>;

// 扫描所有封面图片资源（png/jpg/jpeg/webp/svg/gif）
// 注意：Astro 中图片默认作为组件导入，需通过 query: '?url' 拿到真实资源 URL 字符串
const coverModules = import.meta.glob('../content/books/**/*.{png,jpg,jpeg,webp,svg,gif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

function normalize(p: string): string {
  return p.replace(/\\/g, '/');
}

function relParts(absPath: string): string[] {
  const norm = normalize(absPath);
  const idx = norm.indexOf('content/books/');
  if (idx === -1) return [];
  return norm.slice(idx + 'content/books/'.length).split('/').filter(Boolean);
}

let _booksCache: Book[] | null = null;

async function buildBooks(): Promise<Book[]> {
  if (_booksCache) return _booksCache;
  const entries = await getCollection('books');
  const booksMap = new Map<string, Book>();

  // 1. 收集元信息
  for (const [path, mod] of Object.entries(metaModules)) {
    const meta = mod.default;
    const parts = relParts(path);
    if (parts.length < 1) continue;
    const bookSlug = parts[0];
    booksMap.set(bookSlug, {
      slug: bookSlug,
      title: meta.title || bookSlug,
      author: meta.author || '佚名',
      cover: meta.cover ?? null,
      chapters: [],
      metaChapters: meta.chapters ?? undefined,
    });
  }

  // 2. 收集章节 entry：id 形如 书名/章节名/内容
  for (const entry of entries) {
    const parts = entry.id.split('/').filter(Boolean);
    if (parts.length < 3) continue;
    const bookSlug = parts[0];
    const chapterName = parts[parts.length - 2]; // 倒数第二层为章节目录名
    if (!booksMap.has(bookSlug)) {
      booksMap.set(bookSlug, {
        slug: bookSlug,
        title: bookSlug,
        author: '佚名',
        cover: null,
        chapters: [],
      });
    }
    const book = booksMap.get(bookSlug)!;
    const isMain = parts[parts.length - 1] === '内容.md';
    const exists = book.chapters.find((c) => c.slug === chapterName);
    if (!exists) {
      book.chapters.push({ slug: chapterName, title: chapterName, id: entry.id });
    } else if (isMain) {
      exists.id = entry.id;
    }
  }

  // 3. 解析封面 URL
  for (const book of booksMap.values()) {
    const prefix = `content/books/${book.slug}/`;
    let coverPath: string | undefined;
    for (const p of Object.keys(coverModules)) {
      const norm = normalize(p);
      if (norm.includes(prefix)) {
        const rel = norm.slice(norm.indexOf(prefix) + prefix.length);
        if (book.cover !== null && rel === book.cover) {
          coverPath = p;
          break;
        }
        if (coverPath === undefined && rel.indexOf('/') === -1) coverPath = p;
      }
    }
    if (coverPath) book.cover = coverModules[coverPath];
  }

  const books = Array.from(booksMap.values()).sort((a, b) => a.title.localeCompare(b.title, 'zh'));
  books.forEach((b) => {
    // 按 book.json 中 chapters 定义的顺序排序；未定义的章节按目录名排在后
    const order = b.metaChapters ?? [];
    const orderMap = new Map(order.map((c, i) => [c.slug, i]));
    b.chapters.sort((a, c) => {
      const ia = orderMap.has(a.slug) ? orderMap.get(a.slug)! : Number.MAX_SAFE_INTEGER;
      const ic = orderMap.has(c.slug) ? orderMap.get(c.slug)! : Number.MAX_SAFE_INTEGER;
      if (ia !== ic) return ia - ic;
      return a.title.localeCompare(c.title, 'zh');
    });
    // 用定义里的标题覆盖目录名（缺失则保留目录名）
    if (b.metaChapters) {
      for (const def of b.metaChapters) {
        const ch = b.chapters.find((c) => c.slug === def.slug);
        if (ch && def.title) ch.title = def.title;
      }
    }
  });
  _booksCache = books;
  return books;
}

export async function getAllBooks(): Promise<Book[]> {
  return buildBooks();
}

export async function getBook(slug: string): Promise<Book | undefined> {
  return (await buildBooks()).find((b) => b.slug === slug);
}

export async function getChapter(bookSlug: string, chapterSlug: string): Promise<BookChapter | undefined> {
  return (await getBook(bookSlug))?.chapters.find((c) => c.slug === chapterSlug);
}

export type { CollectionEntry };
