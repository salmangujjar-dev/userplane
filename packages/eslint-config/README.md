# @userplane/eslint-config

## Purpose

`@userplane/eslint-config` provides shared ESLint flat-config presets for the Userplane workspace. It keeps package and app linting consistent across base TypeScript, Node, React-internal, Next.js, and Astro surfaces.

## Import Surface

- `@userplane/eslint-config/base`: base workspace ESLint config.
- `@userplane/eslint-config/node`: Node-oriented config.
- `@userplane/eslint-config/react-internal`: internal React package/app config.
- `@userplane/eslint-config/next-js`: Next.js config.
- `@userplane/eslint-config/astro`: Astro config.

## Consumers

Most workspace packages list this package as a dev dependency, including auth, blurr, cache, client, common-logger, contract, db, email, embed, logger, mcp-apps, metadata, payments, postbridge, pricing, sdk, shared, storage, and ui.

## Quick Start

```js
// eslint.config.mjs
import baseConfig from '@userplane/eslint-config/base';

export default [
  ...baseConfig,
  {
    ignores: ['dist/**'],
  },
];
```

Node package:

```js
import nodeConfig from '@userplane/eslint-config/node';

export default [...nodeConfig];
```

## Architecture

- `base.js` defines the default shared TypeScript lint foundation.
- `node.js` adds Node-specific globals/rules.
- `react-internal.js` adds React rules for internal packages.
- `next.js` adds Next.js-specific linting.
- `astro.js` adds Astro-specific linting.
- Matching `.d.ts` files provide module typing for config imports.

## Scripts

This package has no package-local scripts.

## Tests/Storybook

There is no package-local test or Storybook script. Verify changes by running lint in representative consuming packages/apps.

## Env/Secrets

No environment variables or secrets are required.

## Change Checklist

- Keep export names in `package.json` aligned with config filenames.
- Test changes against at least one base package and any framework-specific consumer affected.
- Avoid adding app-specific lint policy to shared presets unless it applies workspace-wide.
- Check compatibility with ESLint 9 flat config and TypeScript ESLint versions.

## Troubleshooting

- If an import path fails, check the package `exports` map; the Next preset is `@userplane/eslint-config/next-js`.
- If a rule only belongs to one app, add it in that app's config instead of here.
- If type-aware rules fail, verify the consumer's parser options and TypeScript project setup.
- If lint output changes broadly, run representative package lints before merging.
