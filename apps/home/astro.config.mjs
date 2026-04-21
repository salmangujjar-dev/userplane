// @ts-check

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://userplane.io',
  trailingSlash: 'never',
  // Redirects live in `public/_redirects` so Cloudflare Pages serves real 301s
  // instead of the meta-refresh HTML files Astro emits in static mode.
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
    inlineStylesheets: 'always',
  },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/404') && !page.includes('/og-preview'),
      serialize: (item) => {
        if (
          item.url.includes('/integrations/') ||
          item.url.includes('/for/') ||
          item.url.includes('/frameworks/')
        ) {
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
    domains: [
      'cdn.userplane.io',
      'cdn-dev.userplane.io',
      'assets.userplane.io',
      'assets-dev.userplane.io',
    ],
  },
});
