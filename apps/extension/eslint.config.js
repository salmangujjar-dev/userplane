import { config } from '@userplane/eslint-config/react-internal';
import storybookPlugin from 'eslint-plugin-storybook';

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  ...storybookPlugin.configs['flat/recommended'],
  {
    ignores: ['.output/**', '.wxt/**'],
  },
];
