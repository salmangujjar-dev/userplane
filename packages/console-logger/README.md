# @userplane/console-logger

## Purpose

`@userplane/console-logger` is a small structured logger that writes normalized records to `console.*`. It is used by browser-facing packages that need predictable log levels, child loggers, error serialization, and circular-reference protection without depending on Pino.

## Import Surface

- `@userplane/console-logger`: `createLogger`, `Logger`, `LoggerOptions`, and `LogLevel`.

The package exports source TypeScript from `src/index.ts` for workspace consumers.

## Consumers

Package-level consumers include `@userplane/blurr`, `@userplane/cache`, `@userplane/embed`, `@userplane/logger`, `@userplane/metadata`, `@userplane/payments`, `@userplane/postbridge`, and `@userplane/sdk`.

## Quick Start

```ts
import { createLogger } from '@userplane/console-logger';

const logger = createLogger('Recorder', {
  level: 'info',
  base: { package: '@userplane/sdk' },
});

logger.info({ sessionId }, 'Recorder initialized');
logger.error({ err }, 'Recorder failed');

const child = logger.child({ module: 'bridge' });
child.debug('Bridge handshake started');
```

## Architecture

- `src/index.ts` contains the full implementation.
- Log methods accept either a string message or an object plus optional message.
- Error-like values are serialized with name, message, stack, enumerable fields, and cause.
- Plain objects and arrays are normalized recursively with circular references replaced by `"[Circular]"`.
- `child()` returns a logger with merged base bindings.

## Scripts

- `bun run dev`: TypeScript watch mode.
- `bun run build`: remove `dist` and compile with `tsc`.
- `bun run typecheck`: run TypeScript without emitting output.

## Tests/Storybook

There is no package-local test or Storybook script.

## Env/Secrets

No environment variables or secrets are required. Callers choose the log level explicitly.

## Change Checklist

- Keep the logger dependency-free unless there is a clear cross-package reason.
- Preserve overloaded log method behavior for string and object inputs.
- Check browser compatibility before using newer runtime APIs.
- Run `bun run --filter @userplane/console-logger typecheck`.

## Troubleshooting

- If logs are missing, check the configured threshold; lower-priority methods become no-ops.
- If structured fields are missing, ensure the first argument is an object and not a string.
- If errors serialize oddly, check whether the value is an `Error`, `DOMException`, or custom object.
- If a package needs server Pino output, use `@userplane/common-logger` instead.
