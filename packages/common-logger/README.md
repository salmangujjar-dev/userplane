# @userplane/common-logger

## Purpose

`@userplane/common-logger` standardizes structured Pino logging for shared server and browser contexts. It owns logger shape, level formatting, context base fields, and optional pretty output while leaving logging policy to each caller.

This package is `@userplane/common-logger`; it is for structured Pino logging, not browser recording capture.

## Import Surface

- `@userplane/common-logger`: `createServerLogger`, `Logger`, `LogLevel`, and `ServerLoggerOptions`.
- `@userplane/common-logger/browser`: `createClientLogger`, `Logger`, `LogLevel`, and `ClientLoggerOptions`.

## Consumers

Package-level consumers include `@userplane/db` and `@userplane/email`.

## Quick Start

Server logger:

```ts
import { createServerLogger, type LogLevel } from '@userplane/common-logger';

const logger = createServerLogger('api', {
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  pretty: process.env.NODE_ENV !== 'production',
  base: { appEnv: process.env.APP_ENV },
});

logger.info({ route: '/health' }, 'Health check');
```

Browser logger:

```ts
import { createClientLogger } from '@userplane/common-logger/browser';

const logger = createClientLogger('settings-panel', {
  level: 'warn',
});

logger.warn({ tab: 'billing' }, 'Unexpected billing state');
```

## Architecture

- `src/index.ts` builds a Pino server logger and uses `pino-pretty` as a stream when requested.
- `src/browser.ts` builds a Pino browser logger that writes through browser console methods.
- Both entrypoints format levels as labels and include a `context` base field.
- The package does not read application environment variables; app-local wrappers bind env-specific policy once.

## Scripts

- `bun run build`: compile with `tsc`.
- `bun run dev`: compile in watch mode.
- `bun run typecheck`: run TypeScript without emitting output.
- `bun run lint`: run ESLint.

## Tests/Storybook

There is no package-local test or Storybook script.

## Env/Secrets

No environment variables or secrets are read directly. Callers pass level, pretty mode, and base metadata.

## Change Checklist

- Keep server and browser option names aligned where possible.
- Do not add process-env policy inside the package; keep policy in app-local wrappers.
- Verify Pino and `pino-pretty` behavior before changing pretty output.
- Run `bun run --filter @userplane/common-logger typecheck` and `lint`.

## Troubleshooting

- If pretty output fails in a monorepo consumer, keep using `pino-pretty` as a stream rather than a worker-thread transport.
- If browser bundles include server-only code, check for root imports where `/browser` was intended.
- If log fields are missing, verify the caller passes expected `base` metadata.
- If log levels appear numeric, check the Pino `formatters.level` configuration.
