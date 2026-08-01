import { getCollection, type CollectionEntry } from 'astro:content';
import { categoryMeta } from '../consts';

export type Post = CollectionEntry<'posts'>;

// 去掉 Jekyll 式日期前缀，得到干净的 slug（用于 URL）
export function postSlug(post: Post): string {
  return post.id.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

// 按日期降序获取已发布文章
export async function getSortedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

// 中文长日期格式：2026年7月28日
export function formatDate(date: Date, locale = 'zh-CN'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// 估算阅读时间（中文按字符、英文按词），与原文 readingTime 字段语义一致
export function estimateReadingTime(content: string): number {
  const cjk = (content.match(/[一-龥]/g) || []).length;
  const words = (content.replace(/[一-龥]/g, ' ').match(/\b\w+\b/g) || []).length;
  return Math.max(1, Math.ceil(cjk / 350 + words / 220));
}

export interface CategoryInfo {
  name: string;
  slug: string;
  description: string;
  icon: string;
  count: number;
}

export async function getCategories(): Promise<CategoryInfo[]> {
  const posts = await getSortedPosts();
  const counts = new Map<string, number>();
  for (const p of posts) counts.set(p.data.category, (counts.get(p.data.category) || 0) + 1);
  return Array.from(counts.entries()).map(([name, count]) => {
    const meta = categoryMeta[name] || { icon: '📝', description: '' };
    return {
      name,
      slug: encodeURIComponent(name),
      description: meta.description,
      icon: meta.icon,
      count,
    };
  });
}

export async function getTags(): Promise<{ name: string; count: number }[]> {
  const posts = await getSortedPosts();
  const counts = new Map<string, number>();
  for (const p of posts) for (const t of p.data.tags) counts.set(t, (counts.get(t) || 0) + 1);
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getPostsByCategory(category: string): Promise<Post[]> {
  const posts = await getSortedPosts();
  return posts.filter((p) => p.data.category === category);
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const posts = await getSortedPosts();
  return posts.filter((p) => p.data.tags.includes(tag));
}

// 基于共享标签的相关文章
export async function getRelatedPosts(post: Post, limit = 3): Promise<Post[]> {
  const posts = await getSortedPosts();
  return posts
    .filter((p) => p.id !== post.id)
    .map((p) => ({
      post: p,
      common: p.data.tags.filter((t) => post.data.tags.includes(t)).length,
    }))
    .filter((x) => x.common > 0)
    .sort((a, b) => b.common - a.common)
    .slice(0, limit)
    .map((x) => x.post);
}
