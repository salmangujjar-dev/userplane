/**
 * Flat ESLint config for the Raycast extension.
 *
 * ESLint 9 no longer reads `.eslintrc.*` by default. `@raycast/eslint-config`
 * already ships a flat config array, so re-export it directly.
 */
module.exports = require("@raycast/eslint-config");
