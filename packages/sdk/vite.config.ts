import terser from '@rollup/plugin-terser';
import { resolve } from 'path';
import obfuscator from 'rollup-plugin-obfuscator';
import { defineConfig, Plugin } from 'vite';
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

const isProduction = !!optimizeMode || !!obfuscateMode;

// SDK endpoint URLs - configurable via env vars, defaults to production
const recorderBaseUrl = process.env.SDK_RECORDER_BASE_URL || 'https://recorder.userplane.io';
const verificationBaseUrl =
  process.env.SDK_VERIFICATION_BASE_URL || 'https://api.userplane.io/api/v1';

/**
 * Rollup plugin that strips `.debug(...)` call sites from production bundles.
 * The logger level is `warn` in production so these are dead calls, but the
 * call sites, string arguments and object allocations still cost bytes.
 */
function stripDebugCalls(): Plugin {
  return {
    name: 'strip-debug-calls',
    renderChunk(code) {
      const needle = '.debug(';
      let out = '';
      let pos = 0;

      while (pos < code.length) {
        const idx = code.indexOf(needle, pos);
        if (idx === -1) {
          out += code.slice(pos);
          break;
        }

        // Keep everything up to (but not including) the `.debug(`
        out += code.slice(pos, idx);

        // Walk past `.debug(` and track parenthesis depth to find the matching `)`
        let depth = 1;
        let i = idx + needle.length;
        while (i < code.length && depth > 0) {
          if (code[i] === '(') depth++;
          else if (code[i] === ')') depth--;
          i++;
        }

        pos = i;
      }

      return { code: out, map: null };
    },
  };
}

export default defineConfig({
  resolve: {
    conditions: ['source'],
  },
  define: {
    __DEV__: JSON.stringify(!isProduction),
    __RECORDER_BASE_URL__: JSON.stringify(recorderBaseUrl),
    __VERIFICATION_BASE_URL__: JSON.stringify(verificationBaseUrl),
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'UserplaneSDK',
      formats: ['es'],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        exports: 'named',
      },
      plugins: [
        // Strip .debug() calls in production builds (before terser)
        ...(isProduction ? [stripDebugCalls()] : []),
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
      bundledPackages: ['@userplane/metadata', '@userplane/contract'],
    }),
  ],
});
