# Packages

## Purpose

This directory contains the reusable workspace packages that back Userplane apps, SDK distribution, storage/media operations, billing, auth, shared UI, and internal tooling configuration.

Each package README follows the same maintenance template so package owners can quickly answer: what it is for, what can be imported, who consumes it, how to run it locally, what secrets it expects, and what to check before changing it.

## Import Surface

Package import surfaces are defined by each package's `package.json` `exports` field. In general:

- Runtime libraries expose `@userplane/<package>` and, when needed, specific subpaths such as `@userplane/auth/client`, `@userplane/postbridge/bridge`, or `@userplane/storage/media`.
- Config packages expose configuration subpaths instead of runtime APIs, such as `@userplane/eslint-config/base` and `@userplane/typescript-config/base.json`.
- Packages without an application import surface, such as `@userplane/mcp-apps` and `@userplane/zendesk`, are build/artifact packages.

## Consumers

Consumers are workspace apps and sibling packages. Package-level dependencies currently include:

- `@userplane/sdk` consumes `@userplane/blurr`, `@userplane/logger`, `@userplane/metadata`, and `@userplane/postbridge`.
- `@userplane/embed` consumes `@userplane/sdk` and `@userplane/metadata`.
- `@userplane/auth` consumes `@userplane/contract`, `@userplane/db`, `@userplane/payments`, and `@userplane/shared`.
- `@userplane/db`, `@userplane/email`, and `@userplane/payments` share contract, pricing, logging, storage, and shared utilities.
- Most packages consume `@userplane/eslint-config` and `@userplane/typescript-config` as development configuration.

## Quick Start

From the repository root, run package scripts through the workspace filter:

```bash
bun run --filter @userplane/sdk build
bun run --filter @userplane/db db:generate
bun run --filter @userplane/storage assets:manifest
```

Use the package README for package-specific setup before adding imports or running environment-sensitive scripts.

## Architecture

The packages are intentionally split by ownership boundary:

- API contract and typed clients: `contract`, `client`.
- Runtime product capabilities: `auth`, `db`, `email`, `payments`, `pricing`, `cache`, `storage`.
- Browser recording stack: `sdk`, `embed`, `metadata`, `logger`, `blurr`, `postbridge`, `console-logger`.
- UI and app widgets: `ui`, `mcp-apps`, `zendesk`.
- Workspace configuration: `eslint-config`, `typescript-config`.

Keep cross-package imports on exported package paths. Avoid importing sibling package internals unless a package explicitly exports the subpath.

## Scripts

Scripts live in each package's `package.json`. Common names are:

- `build`: compile or bundle the package.
- `dev`: watch compilation or package-specific dev workflow.
- `typecheck`: run TypeScript without emitting output.
- `lint` / `lint:fix`: run ESLint.
- Package-specific scripts such as `db:generate`, `build:cdn`, `assets:upload`, or `package:dev` are documented in the owning package README.

## Tests/Storybook

Test and Storybook coverage is package-specific:

- `blurr`, `logger`, and `postbridge` include Vitest tests.
- `blurr`, `embed`, `logger`, `postbridge`, and `sdk` include Storybook scripts.
- Packages without a local test script usually rely on `typecheck`, `lint`, build verification, or integration coverage from consuming apps.

## Env/Secrets

Most packages do not load `.env` files directly. Server/app packages pass secrets into package factories at runtime. Exceptions are documented in package READMEs, especially:

- `db`: `DATABASE_URL` for Drizzle CLI workflows.
- `embed` and `storage`: R2/CDN upload credentials.
- `payments`: Dodo product IDs read by product mapping helpers.
- `zendesk`: manifest placeholder variables during packaging.

## Change Checklist

- Confirm the package import path or subpath is exported in `package.json`.
- Update the package README when exports, scripts, env vars, or architecture change.
- Run the narrowest useful verification for the package you touched.
- Check reverse package consumers before changing exported types or behavior.
- Keep generated assets or migration artifacts with the source change that requires them.

## Troubleshooting

- If an import fails, check the package `exports` map first.
- If a workspace package sees stale types, rebuild the producer package and rerun the consumer `typecheck`.
- If a script needs secrets, prefer the owning app or package README over guessing variable names.
- If docs disagree with source, treat `package.json`, exported entrypoints, and package scripts as the source of truth.
