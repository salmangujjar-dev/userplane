// @ts-check

import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  server: {
    port: 4322,
    host: true,
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [react()],
});