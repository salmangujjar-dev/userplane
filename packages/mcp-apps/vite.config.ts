import { resolve } from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/** All MCP apps and their entry HTML files. */
const APPS: Record<string, string> = {
  'show-recording': resolve(__dirname, 'src/show-recording/index.html'),
  'show-rec-console': resolve(__dirname, 'src/show-rec-console/index.html'),
  'show-rec-network': resolve(__dirname, 'src/show-rec-network/index.html'),
  'show-rec-actions': resolve(__dirname, 'src/show-rec-actions/index.html'),
};

/**
 * vite-plugin-singlefile doesn't support multiple entry points —
 * it inlines ALL JS/CSS into EVERY HTML file.
 * Use MCP_APP env var to build one app at a time.
 */
const target = process.env.MCP_APP;
if (!target || !APPS[target]) {
  const available = Object.keys(APPS).join(', ');
  throw new Error(`MCP_APP env var must be one of: ${available}`);
}

export default defineConfig({
  root: 'src',
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: false,
    rollupOptions: {
      input: { [target]: APPS[target] },
    },
  },
});
