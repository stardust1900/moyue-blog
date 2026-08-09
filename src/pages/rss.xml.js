import rss from '@astrojs/rss';
import { getSortedPosts, postHref } from '../utils/posts';
import { SITE } from '../consts';

export async function GET(context) {
  const posts = await getSortedPosts();
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      categories: [post.data.category, ...post.data.tags],
      link: postHref(post),
    })),
  });
}
