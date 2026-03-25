import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';
import remarkCnlesson from './src/plugins/remark-cnlesson.mjs';

export default defineConfig({
  site: (process.env.CHRONOSINA_FRONTEND_URL || 'https://loonglore.com').trim(),
  integrations: [svelte(), sitemap()],
  output: 'static',
  build: {
    assets: '_assets',
  },
  vite: {
    build: {
      cssMinify: true,
    },
  },
  markdown: {
    remarkPlugins: [remarkCnlesson],
  },
});
