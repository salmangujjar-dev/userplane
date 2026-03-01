import { nextJsConfig } from '@workspace/eslint-config/next-js';
import storybookPlugin from 'eslint-plugin-storybook';

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  ...storybookPlugin.configs['flat/recommended'],
  {
    ignores: ['next-env.d.ts', 'public/bridge-worker.js'],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
  },
];
