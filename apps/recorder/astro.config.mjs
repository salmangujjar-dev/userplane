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
  },
  integrations: [react()],
});
