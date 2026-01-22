import { nodeConfig } from '@workspace/eslint-config/node';

/** @type {import("eslint").Linter.Config} */
export default [
  ...nodeConfig,
  {
    rules: {
      'turbo/no-undeclared-env-vars': 'off',
    },
  },
];
