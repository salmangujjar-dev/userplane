import { astroConfig } from '@workspace/eslint-config/astro';
import storybookPlugin from 'eslint-plugin-storybook';

/** @type {import("eslint").Linter.Config} */
export default [
  ...astroConfig,
  ...storybookPlugin.configs['flat/recommended'],
  {
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
  },
];
