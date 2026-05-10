# @userplane/shared

## Purpose

`@userplane/shared` contains small cross-package constants and pure utilities that are not owned by a single feature package. Current areas include shared copy, site metadata helpers, environment-name helpers, and disposable email domain checks.

## Import Surface

- `@userplane/shared`: shared copy constants and disposable email helpers.
- `@userplane/shared/env`: environment types and helpers such as `parseAppEnv`, `getEnvFileName`, and `isSecureEnvironment`.
- `@userplane/shared/meta`: site/app metadata constants and helpers.

## Consumers

Package-level consumers include `@userplane/auth` and `@userplane/email`.

## Quick Start

```ts
import { COMPANY_NAME, isDisposableEmail } from '@userplane/shared';
import { parseAppEnv } from '@userplane/shared/env';
import { createMeta } from '@userplane/shared/meta';

const appEnv = parseAppEnv(process.env.APP_ENV);
const blocked = isDisposableEmail('person@example.com');
const meta = createMeta({ title: `${COMPANY_NAME} Dashboard` });
```

## Architecture

- `src/copy.ts` owns company, support, website, and shared 404 copy constants.
- `src/disposable-email.ts` checks domains against `src/data/email.json`.
- `src/env.ts` normalizes environment names and environment file names.
- `src/meta.ts` owns default SEO/app metadata helpers.
- `src/index.ts` exports only copy and disposable-email helpers; use subpaths for env and meta helpers.

## Scripts

- `bun run build`: compile with `tsc`.
- `bun run dev`: compile in watch mode.
- `bun run lint`: run ESLint with zero warnings.
- `bun run lint:fix`: apply ESLint fixes.
- `bun run typecheck`: run TypeScript without emitting output.

## Tests/Storybook

There is no package-local test or Storybook script. Use `typecheck`, `lint`, and targeted tests in consuming packages if behavior becomes more complex.

## Env/Secrets

No secrets are required. Environment helpers parse values passed in by callers.

## Change Checklist

- Keep root exports small; add a subpath when a utility has a distinct ownership area.
- Check legal/content references before changing `WEBSITE_URL` or `SUPPORT_EMAIL`.
- Check auth flows before changing disposable email behavior.
- Run `bun run --filter @userplane/shared typecheck` and `lint`.

## Troubleshooting

- If an env value falls back to development, check `isValidEnvironment` and `parseAppEnv`.
- If a disposable domain is not detected, verify the normalized domain exists in `src/data/email.json`.
- If metadata is wrong in an app, check whether the app overrides `SITE_META` through `createMeta`.
- If an import from `@userplane/shared/env` fails, confirm the package build output includes the subpath.
