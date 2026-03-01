import { nodeConfig } from '@userplane/eslint-config/node';

export default [
  ...nodeConfig,
  {
    rules: {
      'turbo/no-undeclared-env-vars': 'warn',
    },
  },
];
