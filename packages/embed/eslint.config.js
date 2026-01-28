import { config } from '@workspace/eslint-config/base';

export default [
  ...config,
  {
    ignores: ['example/**'],
  },
  {
    rules: {
      'turbo/no-undeclared-env-vars': 'warn',
    },
  },
];
