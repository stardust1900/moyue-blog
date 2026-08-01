import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { postSlug } from '../utils/posts';
import { SITE } from '../consts';

export async function GET(context) {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  const sorted = posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site,
    items: sorted.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      categories: [post.data.category, ...post.data.tags],
      link: `/posts/${postSlug(post)}/`,
    })),
  });
}
