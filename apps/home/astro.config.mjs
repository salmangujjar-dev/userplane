// @ts-check

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  server: {
    port: 4321,
    host: true,
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ['home-dev.userplane.io'],
    },
  },
  integrations: [react()],
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
