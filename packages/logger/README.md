# @workspace/logger

Structured logging package using Pino with support for Node.js, Bun, Next.js, and Astro.

## Installation

```bash
bun add @workspace/logger
```

## Usage

### Server-side (Node.js/Bun/API routes)

Simple one-line usage with automatic environment detection:

```typescript
import { createAppLogger } from '@workspace/logger';

const logger = createAppLogger('my-service');

logger.info({ userId: 123 }, 'User logged in');
logger.error({ err }, 'Something failed');
logger.debug({ data }, 'Debug info');
```

### Next.js Usage

#### Server Components / API Routes

```typescript
// app/api/users/route.ts
import { createAppLogger } from '@workspace/logger';

const logger = createAppLogger('api-users');

export async function GET() {
  logger.info('Fetching users');
  // ...
}
```

#### Client Components

```typescript
// app/components/MyComponent.tsx
'use client';

import { createBrowserLogger } from '@workspace/logger/browser';

const logger = createBrowserLogger('my-component');

export default function MyComponent() {
  const handleClick = () => {
    logger.info({ action: 'click' }, 'Button clicked');
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

#### Universal (works everywhere)

```typescript
// Works in both server and client
import { createUniversalLogger } from '@workspace/logger';

const logger = await createUniversalLogger('my-context');
logger.info('This works anywhere!');
```

### Astro Usage

#### Server-side (pages, endpoints)

```typescript
// src/pages/api/hello.ts
import { createAppLogger } from '@workspace/logger';

const logger = createAppLogger('api-hello');

export async function GET() {
  logger.info('Hello endpoint called');
  return new Response(JSON.stringify({ message: 'Hello' }));
}
```

#### Client-side scripts

```typescript
// src/scripts/analytics.ts
import { createBrowserLogger } from '@workspace/logger/browser';

const logger = createBrowserLogger('analytics');

logger.info({ page: window.location.pathname }, 'Page view');
```

## API

### `createAppLogger(context: string, options?)`

Creates a logger with automatic environment-aware configuration.

**Options:**

- `level`: Log level (default: 'debug' in dev, 'info' in prod)
- `pretty`: Enable pretty printing (default: true in dev, false in prod)
- `base`: Additional base data to include in all logs

### `createBrowserLogger(context: string, level?)`

Browser-compatible logger that uses console methods.

### `createUniversalLogger(context: string, options?)`

Async function that creates appropriate logger for the environment.

### `createServerLogger(context: string, options?)`

Server-only logger (throws error in browser).

## Environment Variables

- `NODE_ENV`: Environment mode (development/production)
- `LOG_LEVEL`: Override log level (trace/debug/info/warn/error/fatal)

## Features

- ✅ Structured JSON logging
- ✅ Pretty colored output in development
- ✅ Works in Node.js, Bun, Next.js, and Astro
- ✅ Browser-compatible logging
- ✅ TypeScript support
- ✅ Automatic environment detection
- ✅ Context-based child loggers
