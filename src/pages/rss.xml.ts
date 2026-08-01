import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../config/site.mjs';

export async function GET(context) {
  const blog = await getCollection('blog', ({ data }) => !data.draft);
  return rss({
    title: 'Baixin Guo — Blog',
    description: 'Research notes and essays on human-AI trust calibration',
    site: SITE.url,
    items: blog.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.excerpt,
      link: `/blog/${post.id}/`,
    })),
  });
}
