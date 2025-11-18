import { config as reactConfig } from './react-internal.js';

/**
 * A custom ESLint configuration for Astro applications with React support.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const astroConfig = [
  ...reactConfig,
  {
    files: ['**/*.astro'],
    parser: 'astro-eslint-parser',
    parserOptions: {
      parser: '@typescript-eslint/parser',
      extraFileExtensions: ['.astro'],
    },
  },
];
