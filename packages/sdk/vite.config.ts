import terser from '@rollup/plugin-terser';
import { resolve } from 'path';
import obfuscator from 'rollup-plugin-obfuscator';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

import { cdnPreset, npmPreset } from './obfuscator.config';

// Build modes:
// - OPTIMIZE_MODE: 'npm' | 'cdn' - Size-optimized builds (aggressive minification, no obfuscation)
// - OBFUSCATE_MODE: 'npm' | 'cdn' - IP-protected builds (obfuscation enabled)
// - Neither: Standard development build with sourcemaps
const optimizeMode = process.env.OPTIMIZE_MODE as 'npm' | 'cdn' | undefined;
const obfuscateMode = process.env.OBFUSCATE_MODE as 'npm' | 'cdn' | undefined;

// Obfuscation config (only for obfuscate builds)
const obfuscatorConfig =
  obfuscateMode === 'cdn' ? cdnPreset : obfuscateMode === 'npm' ? npmPreset : undefined;

// Determine if we should drop console (all builds except standard dev build)
const shouldDropConsole = !!optimizeMode || !!obfuscateMode;

// Determine if sourcemaps should be generated (only for standard build)
const shouldGenerateSourcemap = !optimizeMode && !obfuscateMode;

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

// Terser config for standard/obfuscate builds
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

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'UserplaneSDK',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        exports: 'named',
      },
      plugins: [
        // Terser for minification and comment stripping
        terser(terserConfig),
        // Obfuscator runs after terser (only for obfuscate builds)
        ...(obfuscatorConfig ? [obfuscator({ options: obfuscatorConfig })] : []),
      ],
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
