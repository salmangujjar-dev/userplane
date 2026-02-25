# @workspace/logger

Structured logging using Pino. Two exports: server and client. Both return `pino.Logger`.

The package owns **structure** (formatters, base field shape, pretty-print config).
Callers own **policy** (log level, pretty-printing, base metadata).
The package does not read `process.env` -- each app passes config explicitly.

## Exports

### `@workspace/logger` -- `createServerLogger`

Server-side logger using Pino with optional pretty-printing via pino-pretty transport.

```typescript
import { createServerLogger, type LogLevel } from '@workspace/logger';

const logger = createServerLogger('my-service', {
  level: 'debug',
  pretty: true,
  base: { env: 'development', appEnv: 'local' },
});

logger.info({ userId: 123 }, 'User logged in');
logger.error({ err }, 'Something failed');
```

**`ServerLoggerOptions`:**

| Field    | Type                      | Required | Description                                     |
| -------- | ------------------------- | -------- | ----------------------------------------------- |
| `level`  | `LogLevel`                | yes      | Log level -- caller decides based on their env  |
| `pretty` | `boolean`                 | no       | Enable pretty-printed output (default: `false`) |
| `base`   | `Record<string, unknown>` | no       | Additional base fields on every log line        |

### `@workspace/logger/browser` -- `createClientLogger`

Client-side logger using Pino's native browser build. Outputs structured objects via `console.*` methods.

```typescript
import { createClientLogger } from '@workspace/logger/browser';

const logger = createClientLogger('my-component', { level: 'info' });

logger.info({ action: 'click' }, 'Button clicked');
```

**`ClientLoggerOptions`:**

| Field   | Type                      | Required | Description                                    |
| ------- | ------------------------- | -------- | ---------------------------------------------- |
| `level` | `LogLevel`                | yes      | Log level -- caller decides based on their env |
| `base`  | `Record<string, unknown>` | no       | Additional base fields on every log line       |

## App-local wrappers

Each app should create a thin local wrapper that binds env-specific config once:

```typescript
// apps/api/src/lib/logger.ts
import { createServerLogger, type LogLevel } from '@workspace/logger';
import { env } from '@/api/env';

const isDev = env.server.nodeEnv !== 'production';

export function createLogger(context: string) {
  return createServerLogger(context, {
    level: (process.env.LOG_LEVEL as LogLevel) || (isDev ? 'debug' : 'info'),
    pretty: isDev,
    base: { env: env.server.nodeEnv, appEnv: env.server.appEnv },
  });
}
```

Then all files in that app import from the local wrapper:

```typescript
import { createLogger } from '@/api/lib/logger';

const logger = createLogger('my-module');
```

## Standardized behavior

Both loggers share the same structural conventions:

- Level formatted as label (`{ level: 'info' }` not `{ level: 30 }`)
- `context` field in base for identifying the module
- Returns `pino.Logger` -- same type, same API surface everywhere
