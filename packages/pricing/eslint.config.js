import { config } from '@userplane/eslint-config/base';

export default [
  ...config,
  {
    rules: {
      'turbo/no-undeclared-env-vars': 'warn',
    },
  },
];
