import { config } from '@userplane/eslint-config/base';

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  {
    ignores: ['**/*.mdx', '**/*.md'],
  },
];
