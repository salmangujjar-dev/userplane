# @userplane/typescript-config

## Purpose

`@userplane/typescript-config` stores shared TypeScript configuration files for the workspace. Packages and apps extend these JSON configs to keep compiler targets, module settings, JSX settings, and strictness consistent.

## Import Surface

This package exposes configuration files by path rather than a package `exports` map:

- `@userplane/typescript-config/base.json`
- `@userplane/typescript-config/node.json`
- `@userplane/typescript-config/react-library.json`
- `@userplane/typescript-config/nextjs.json`
- `@userplane/typescript-config/astro.json`

## Consumers

Most workspace packages list this package as a dev dependency, including auth, blurr, cache, client, common-logger, console-logger, contract, db, email, embed, logger, mcp-apps, metadata, payments, postbridge, pricing, sdk, shared, storage, and ui.

## Quick Start

Package TypeScript config:

```json
{
  "extends": "@userplane/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
```

React library package:

```json
{
  "extends": "@userplane/typescript-config/react-library.json",
  "include": ["src", "stories"]
}
```

## Architecture

- `base.json` is the common foundation for TypeScript packages.
- `node.json` is for Node-oriented code.
- `react-library.json` is for React component/library packages.
- `nextjs.json` is for Next.js apps.
- `astro.json` is for Astro apps.

The package is private workspace configuration and does not compile source code.

## Scripts

This package has no package-local scripts.

## Tests/Storybook

There is no package-local test or Storybook script. Verify changes by running `typecheck` in representative consuming packages/apps.

## Env/Secrets

No environment variables or secrets are required.

## Change Checklist

- Check representative consumers before changing shared compiler settings.
- Keep config filenames stable unless every extending `tsconfig.json` is updated.
- Avoid putting package-specific compiler options in shared configs.
- Verify Next.js, React library, and Node consumers separately when changing module or JSX settings.

## Troubleshooting

- If TypeScript cannot resolve an extended config, check the filename and package dependency.
- If emits go to the wrong directory, set `outDir` in the consuming package.
- If JSX settings are wrong, confirm the consumer extends the React or framework-specific config.
- If a shared strictness change creates broad failures, roll it out with package-level fixes in the same workstream.
