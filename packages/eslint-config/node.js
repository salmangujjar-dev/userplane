import { config as baseConfig } from './base.js';

/**
 * A custom ESLint configuration for Node.js/Bun applications.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const nodeConfig = [...baseConfig];
