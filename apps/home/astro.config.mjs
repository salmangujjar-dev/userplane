// @ts-check

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://userplane.io',
  trailingSlash: 'never',
  redirects: {
    '/intercom': '/integrations/intercom',
  },
  server: {
    port: 4321,
    host: true,
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    server: {
      allowedHosts: ['home-dev.userplane.io'],
    },
  },
  prefetch: {
    defaultStrategy: 'hover',
  },
  build: {
    inlineStylesheets: 'auto',
  },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/404'),
      serialize: (item) => {
        item.lastmod = new Date().toISOString();
        if (item.url.includes('/integrations/') || item.url.includes('/for/') || item.url.includes('/frameworks/')) {
          item.priority = 0.8;
        }
        return item;
      },
    }),
  ],
  image: {
    // Use custom Cloudflare image service for on-the-fly transforms
    // @see https://developers.cloudflare.com/images/transform-images/transform-via-url/
    service: {
      entrypoint: './src/lib/cloudflare-image-service.ts',
    },
    // Allow images from CDN domains
    domains: ['cdn.userplane.io', 'cdn-dev.userplane.io', 'assets.userplane.io', 'assets-dev.userplane.io'],
  },
});
