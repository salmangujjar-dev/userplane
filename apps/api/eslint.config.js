import { nodeConfig } from '@userplane/eslint-config/node';

/** @type {import("eslint").Linter.Config} */
export default [
  ...nodeConfig,
  {
    rules: {
      'turbo/no-undeclared-env-vars': 'warn',
    },
  },
];
