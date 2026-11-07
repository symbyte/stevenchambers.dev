import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://stevenchambers.dev',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: { shikiConfig: { theme: 'github-dark' } },
});
