import { config as baseConfig } from '@userplane/eslint-config/base';
import storybookPlugin from 'eslint-plugin-storybook';

/** @type {import("eslint").Linter.Config} */
export default [
  ...baseConfig,
  ...storybookPlugin.configs['flat/recommended'],
  {
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
  },
];
