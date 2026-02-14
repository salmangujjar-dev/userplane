// @ts-check

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  server: {
    port: 4322,
    host: true,
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      sourcemap: true,
    },
    server: {
      allowedHosts: ['recorder-dev.userplane.io'],
    },
  },
  integrations: [react()],
});
