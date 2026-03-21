import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  envDir: resolve(__dirname),
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  base: '/zendesk/assets/',
  build: {
    outDir: resolve(__dirname, 'dist/app'),
    emptyOutDir: true,
    assetsDir: '.',
    rollupOptions: {
      input: resolve(__dirname, 'src/index.html'),
    },
    manifest: true,
  },
});
