<div align="center">

<h1>@userplane/metadata</h1>

<p>Attach custom metadata to Userplane recordings</p>

<p>
  <a href="https://userplane.io">Website</a> |
  <a href="https://userplane.io/help">Docs</a>
</p>

</div>

---

## Package Overview

| Package               | Use Case                            |
| --------------------- | ----------------------------------- |
| `@userplane/metadata` | Standalone metadata-only            |
| `@userplane/sdk`      | NPM install (SSR-safe, manual init) |
| `@userplane/embed`    | CDN/script tag (auto-initializes)   |

## Installation

```bash
npm i @userplane/metadata
```

- Zero runtime dependencies
- ESM-only
- `sideEffects: false`

## Quick Start

```typescript
import { metadata, set } from '@userplane/metadata';

// Static defaults
set('appVersion', '2.1.0');
set('environment', 'production');

// Dynamic metadata (called at recording submission time)
metadata(() => ({
  userId: getCurrentUser().id,
  route: window.location.pathname,
}));
```

## API

### `metadata(fn)`

Register a function that returns metadata. The function is called lazily when a recording is submitted, not when registered. Calling again replaces the previous function.

```typescript
metadata(() => ({
  userId: getCurrentUser().id,
  plan: 'enterprise',
}));
```

### `set(key, value)`

Set a static key-value pair as a default. Each call adds or updates that specific key.

```typescript
set('appVersion', '2.1.0');
set('buildId', '12345');
```

### `getCustomMetadata()`

Retrieves the merged metadata object. Merges static defaults with function results (function takes priority). Returns `null` if no metadata is registered.

```typescript
import { getCustomMetadata } from '@userplane/metadata';

const data = getCustomMetadata();
// { appVersion: '2.1.0', buildId: '12345', userId: '...', plan: 'enterprise' }
```

### `clearMetadata(keyOrType?)`

Clear metadata based on the provided parameter:

```typescript
clearMetadata(); // clear everything (function + all static)
clearMetadata('function'); // clear only the metadata function
clearMetadata('static'); // clear all static key-value pairs
clearMetadata('userId'); // clear a specific static key
```

## Merge Behavior

Static defaults and function results are merged at retrieval time. Function metadata takes priority on overlapping keys:

```typescript
set('appVersion', '2.1.0');
set('environment', 'production');

metadata(() => ({
  userId: 'u_123',
  appVersion: '3.0.0-beta', // overrides the static value
}));

getCustomMetadata();
// { appVersion: '3.0.0-beta', environment: 'production', userId: 'u_123' }
```

## Types

```typescript
type Serializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | Serializable[]
  | SerializableObject;

interface SerializableObject {
  [key: string]: Serializable;
}

type MetadataFunction = () => SerializableObject;
```

## When to Use Standalone

`@userplane/sdk` re-exports `metadata()`, `set()`, and `clearMetadata()` — so if you're already using the SDK, you don't need this package.

Use `@userplane/metadata` standalone when:

- You're using the `<script>` tag embed and want to set metadata from a separate module
- You want to register metadata without pulling in the full SDK
- You're in a context that doesn't need recorder control (e.g., a shared utility module)

Metadata is stored at `window.__userplane__.exports` and shared across all Userplane packages on the page.

## License

[Fair Source License v0.9](LICENSE)
