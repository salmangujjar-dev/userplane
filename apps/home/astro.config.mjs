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
});
