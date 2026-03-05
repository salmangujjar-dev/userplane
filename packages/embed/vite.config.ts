import terser from '@rollup/plugin-terser';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// Build mode: 'cdn' for CDN distribution, undefined for npm package
const optimizeMode = process.env.OPTIMIZE_MODE as 'cdn' | undefined;

// CDN configuration - constructs base URL from CDN_DOMAIN + R2_CDN_PREFIX
const cdnDomain = process.env.CDN_DOMAIN || 'https://cdn.userplane.io';
const cdnPrefix = process.env.R2_CDN_PREFIX || 'embed';
const cdnBaseUrl = `${cdnDomain}/${cdnPrefix}`;

// Terser config for CDN builds (aggressive optimization)
const cdnTerserConfig = {
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
    drop_console: true,
    drop_debugger: true,
    dead_code: true,
    unused: true,
  },
  mangle: {
    properties: {
      regex: /^_/,
    },
  },
};

// Terser config for standard builds
const standardTerserConfig = {
  format: {
    comments: ((_: unknown, comment: { type: string; value: string }) =>
      /@__PURE__|@__INLINE__/.test(comment.value)) as unknown as boolean,
  },
  compress: {
    drop_console: false,
    drop_debugger: true,
    passes: 2,
  },
  mangle: true,
};

// Select config based on build mode
const isCdnBuild = optimizeMode === 'cdn';
const terserConfig = isCdnBuild ? cdnTerserConfig : standardTerserConfig;

const isProduction = isCdnBuild;

export default defineConfig({
  resolve: {
    conditions: ['source'],
  },
  define: {
    __DEV__: JSON.stringify(!isProduction),
    ...(isCdnBuild ? { __CDN_BASE_URL__: JSON.stringify(cdnBaseUrl) } : {}),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: isCdnBuild
      ? {
          // CDN build: outputs script.js and main.js as ES modules
          // (they're self-executing, so ES format works fine)
          entry: {
            script: resolve(__dirname, 'src/script.ts'),
            main: resolve(__dirname, 'src/index.ts'),
          },
          name: 'UserplaneEmbed',
          formats: ['es'],
          fileName: (_format, entryName) => `${entryName}.js`,
        }
      : {
          // Standard npm build: outputs ES and CJS modules
          entry: resolve(__dirname, 'src/index.ts'),
          name: 'UserplaneEmbed',
          formats: ['es', 'cjs'],
          fileName: (format) => `index.${format}.js`,
        },
    rollupOptions: {
      external: [],
      output: isCdnBuild
        ? {
            globals: {},
          }
        : {
            globals: {},
            exports: 'named',
          },
      plugins: [terser(terserConfig)],
    },
    sourcemap: !isCdnBuild,
    minify: false, // Using rollup terser plugin
  },
  esbuild: {
    legalComments: 'none',
    drop: ['debugger'],
  },
  plugins: isCdnBuild
    ? []
    : [
        dts({
          include: ['src'],
          rollupTypes: true,
        }),
      ],
});
