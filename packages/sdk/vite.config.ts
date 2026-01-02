import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'UserplaneSDK',
      formats: ['es', 'umd'],
      fileName: (format) => {
        if (format === 'umd') {
          return 'sdk.umd.cjs';
        }
        return 'sdk.js';
      },
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        exports: 'named',
      },
    },
    sourcemap: true,
    minify: 'esbuild',
  },
  plugins: [
    dts({
      include: ['src'],
      rollupTypes: true,
    }),
  ],
});
