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
    sitemap({
    customPages: [
      'https://gbx-max1220.github.io/maxguo.dev/research/china-time-use-2024/',
      'https://gbx-max1220.github.io/maxguo.dev/research/china-time-use-2024/report/',
      'https://gbx-max1220.github.io/maxguo.dev/research/china-time-use-2024/en/',
      'https://gbx-max1220.github.io/maxguo.dev/research/china-time-use-2024/en/report/',
      'https://gbx-max1220.github.io/maxguo.dev/research/offline-policy-improvement/'
    ],
    // Research drafts may be browsable on review branches but must never be promoted by sitemap discovery.
    filter: (page) => !page.includes('/critical-inquiry/cases/'),
  }),
    tailwind({ applyBaseStyles: false }),
  ],
});
