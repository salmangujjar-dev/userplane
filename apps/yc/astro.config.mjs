// @ts-check
import { resolve } from 'node:path';

import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  server: {
    port: 4444
  },
  vite: {
    resolve: {
      alias: {
        // Point directly at SDK source so yc works without building
        // the SDK first. Vite handles the TS transpilation on the fly.
        '@workspace/sdk': resolve(import.meta.dirname, '../../packages/sdk/src/index.ts'),
      },
    },
    optimizeDeps: {
      exclude: ['@workspace/sdk']
    },
    server: {
      allowedHosts: ['yc-dev.userplane.io'],
    }
  }
});
