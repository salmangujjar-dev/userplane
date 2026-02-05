// @ts-check
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  server: {
    port: 4444
  },
  vite: {
    optimizeDeps: {
      exclude: ['@workspace/sdk']
    },
    server: {
      allowedHosts: ['playground-dev.userplane.io'],
    }
  }
});
