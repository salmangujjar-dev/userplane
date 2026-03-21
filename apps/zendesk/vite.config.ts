import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  root: 'src',
  envDir: resolve(__dirname),
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'manifest.json', dest: '..' },
        { src: 'translations', dest: '..' },
        { src: 'assets/*', dest: '.' },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  base: './',
  build: {
    outDir: resolve(__dirname, 'dist/assets'),
    emptyOutDir: true,
    assetsDir: '.',
    rollupOptions: {
      input: resolve(__dirname, 'src/index.html'),
    },
  },
});
