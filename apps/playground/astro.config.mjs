// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

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
      allowedHosts: ['.ngrok-free.app', '.ngrok.io']
    }
  }
});
