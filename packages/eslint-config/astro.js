import { config as reactConfig } from './react-internal.js';

/**
 * A custom ESLint configuration for Astro applications with React support.
 * Note: For Astro files, use astro check instead of ESLint.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const astroConfig = [
  ...reactConfig,
  {
    ignores: ['**/*.astro'],
  },
];
