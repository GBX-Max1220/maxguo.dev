import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://gbx-max1220.github.io',
  base: '/maxguo.dev',
  integrations: [
    mdx(),
    sitemap(),
  ],
});
