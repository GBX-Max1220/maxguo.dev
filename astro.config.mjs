import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { SITE } from './src/config/site.mjs';

export default defineConfig({
  site: SITE.origin,
  base: SITE.base,
  integrations: [
    mdx(),
    sitemap(),
    tailwind({ applyBaseStyles: false }),
  ],
});
