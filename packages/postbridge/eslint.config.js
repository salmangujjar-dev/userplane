import { config as baseConfig } from '@workspace/eslint-config/base';
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
  {
    files: ['examples/**/*.js'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
  },
  {
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
