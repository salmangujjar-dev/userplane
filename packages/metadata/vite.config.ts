import terser from '@rollup/plugin-terser';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// Build mode: 'npm' | 'cdn' for size-optimized builds, undefined for standard dev build
const optimizeMode = process.env.OPTIMIZE_MODE as 'npm' | 'cdn' | undefined;

// Drop console for all optimized builds, keep for standard dev build
const shouldDropConsole = !!optimizeMode;

// Sourcemaps only for standard dev build
const shouldGenerateSourcemap = !optimizeMode;

// Terser config for size-optimized builds (aggressive)
const optimizedTerserConfig = {
  format: {
    comments: false,
    ecma: 2020 as const,
  },
  compress: {
    passes: 3,
    pure_getters: true,
    unsafe: true,
    unsafe_comps: true,
    unsafe_math: true,
    unsafe_methods: true,
    drop_console: shouldDropConsole,
    drop_debugger: true,
    dead_code: true,
    unused: true,
  },
  mangle: {
    properties: {
      regex: /^_/, // Mangle private properties (prefixed with _)
    },
  },
};

// Terser config for standard dev build
const standardTerserConfig = {
  format: {
    comments: ((_: unknown, comment: { type: string; value: string }) =>
      /@__PURE__|@__INLINE__/.test(comment.value)) as unknown as boolean,
  },
  compress: {
    drop_console: shouldDropConsole,
    drop_debugger: true,
    passes: 2,
  },
  mangle: true,
};

// Select terser config based on build mode
const terserConfig = optimizeMode ? optimizedTerserConfig : standardTerserConfig;

const isProduction = !!optimizeMode;

export default defineConfig({
  define: {
    __DEV__: JSON.stringify(!isProduction),
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'UserplaneMetadata',
      formats: ['es'],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        exports: 'named',
      },
      plugins: [terser(terserConfig)],
    },
    sourcemap: shouldGenerateSourcemap,
    minify: false, // Using rollup terser plugin instead
  },
  esbuild: {
    legalComments: 'none',
    drop: ['debugger'],
  },
  plugins: [
    dts({
      include: ['src'],
      rollupTypes: true,
    }),
  ],
});
