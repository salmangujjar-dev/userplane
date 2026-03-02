<div align="center">

<h1>@userplane/sdk</h1>

<p>Tree-shakeable, SSR-safe SDK for the Userplane Recorder</p>

<p>
  <a href="#quick-start"><strong>Quick Start</strong></a> |
  <a href="#initialize-options"><strong>Options</strong></a> |
  <a href="#metadata"><strong>Metadata</strong></a> |
  <a href="#api-reference"><strong>API Reference</strong></a>
</p>

</div>

---

## Package Overview

| Package               | Use Case                            |
| --------------------- | ----------------------------------- |
| `@userplane/sdk`      | NPM install (SSR-safe, manual init) |
| `@userplane/embed`    | CDN/script tag (auto-initializes)   |
| `@userplane/metadata` | Standalone metadata-only            |

## Installation

```bash
npm i @userplane/sdk
```

- ESM-only
- `sideEffects: false` — fully tree-shakeable
- Single runtime dependency: `nanoid`

## Quick Start

```typescript
import * as userplane from '@userplane/sdk';

// Guard for SSR (Next.js, Nuxt, SvelteKit, etc.)
if (typeof window !== 'undefined') {
  userplane.initialize({
    workspaceId: 'ws_xxx',
  });
}
```

When users visit a recording link:

```
https://yoursite.com?userplane-action=recording&userplane-token=abc123
```

The recorder automatically mounts. No side effects on import — nothing happens until you call `initialize()`.

## SSR / Framework Usage

The SDK is safe to import in server-rendered frameworks. All functions are no-ops until `initialize()` is called in the browser.

**Next.js (App Router)**

```typescript
'use client';

import * as userplane from '@userplane/sdk';
import { useEffect } from 'react';

export function UserplaneProvider() {
  useEffect(() => {
    userplane.initialize({ workspaceId: 'ws_xxx' });
    return () => userplane.destroy();
  }, []);
  return null;
}
```

**Next.js / Nuxt / SvelteKit (general pattern)**

```typescript
if (typeof window !== 'undefined') {
  userplane.initialize({ workspaceId: 'ws_xxx' });
}
```

## Initialize Options

```typescript
interface InitializeOptions {
  /**
   * Workspace ID(s) for validation.
   * Defaults to reading from <meta name="userplane:workspace"> tags.
   * Accepts:
   * - Single ID: 'ws_xxx'
   * - Comma-separated: 'ws_xxx,ws_yyy'
   * - Array: ['ws_xxx', 'ws_yyy']
   */
  workspaceId?: string | string[];

  /**
   * Whether to auto-open recorder when URL params are detected.
   * - true (default): Auto-open when userplane-action=recording is in URL
   * - false: Don't auto-open, wait for manual open() call
   * - string: Recording token to open immediately
   */
  openImmediately?: boolean | string;

  /**
   * Whether to enable the capture iframe for background metadata collection.
   * @default true
   */
  captureEnabled?: boolean;

  /**
   * Base URL for the recorder app.
   * Defaults to production CDN URL.
   */
  recorderBaseUrl?: string;

  /**
   * Base URL for the verification API.
   */
  verificationBaseUrl?: string;

  /**
   * Custom function to parse userplane data from URL.
   * Default extracts userplane-action and userplane-token from query params.
   */
  parseUserplaneData?: (href: string) => SerializableUserplaneData | null;

  /**
   * URLs to exclude from network log capture.
   * Merged with Userplane's internal endpoints.
   */
  excludeCaptureEndpoints?: string[];
}
```

## Recorder Control

### `open(token?)`

Opens the recorder. If no token is provided, uses the token from URL params or deferred params (when `openImmediately` was `false`).

```typescript
// Open from URL params
userplane.open();

// Open with a specific token
userplane.open('recording-token');
```

Returns `true` if the recorder was opened, `false` otherwise.

### `unmount()`

Closes and unmounts the recorder iframe.

```typescript
userplane.unmount();
```

### `destroy()`

Tears down the SDK completely and resets all state. After calling `destroy()`, you can call `initialize()` again. Useful for workspace switches or logout flows.

```typescript
userplane.destroy();
userplane.initialize({ workspaceId: 'ws_new' });
```

## State Inspection

```typescript
userplane.isInitialized(); // true if initialize() has been called
userplane.isRecorderMounted(); // true if recorder iframe is visible
userplane.isBridgeConnected(); // true if bridge to recorder is established
userplane.getRecordingState(); // 'inactive' | 'active' | 'retained'
userplane.getRecordingContext(); // { state, sessionInfo, tabUnloadEnabled } | null
userplane.getSessionId(); // session ID string or null
userplane.getLinkId(); // link ID string or null
```

### Recording States

| State        | Meaning                                                    |
| ------------ | ---------------------------------------------------------- |
| `'inactive'` | No recording in progress                                   |
| `'active'`   | Recording is in progress                                   |
| `'retained'` | Recording exists but not yet submitted (review, uploading) |

## Metadata

Attach custom context to recordings. Metadata is collected when a recording is submitted, not when registered.

### `metadata(fn)`

Register a function that returns metadata. Called lazily at submission time, so it captures current state.

```typescript
userplane.metadata(() => ({
  userId: getCurrentUser().id,
  plan: 'enterprise',
  route: window.location.pathname,
}));
```

Calling `metadata()` again replaces the previous function.

**React integration:**

```typescript
useEffect(() => {
  userplane.metadata(() => ({
    userId: user?.id,
    route: location.pathname,
  }));
}, [user, location]);
```

### `set(key, value)`

Set static key-value metadata as defaults. Static metadata provides baseline values that the dynamic function can override.

```typescript
userplane.set('appVersion', '2.1.0');
userplane.set('environment', 'production');
```

### Merge Behavior

Static defaults are merged with function results. Function metadata takes priority on overlapping keys:

```typescript
userplane.set('appVersion', '2.1.0');
userplane.set('environment', 'production');

userplane.metadata(() => ({
  userId: getCurrentUser().id,
  appVersion: '3.0.0-beta', // overrides the static value
}));

// Result: { appVersion: '3.0.0-beta', environment: 'production', userId: '...' }
```

### `clearMetadata(keyOrType?)`

```typescript
userplane.clearMetadata(); // clear everything (function + all static)
userplane.clearMetadata('function'); // clear only the metadata function
userplane.clearMetadata('static'); // clear all static key-value pairs
userplane.clearMetadata('userId'); // clear a specific static key
```

## Tab Identity

Each browser tab gets a unique reference that persists across page refreshes (via `sessionStorage`).

```typescript
const tabRef = userplane.getTabRef(); // e.g. "V1StGXR8_Z5jdHi6B"

userplane.clearTabRef(); // clear; a new ref is generated on next initialize()
```

## URL Parameters

Recording links use these query parameters:

| Parameter          | Description                          |
| ------------------ | ------------------------------------ |
| `userplane-action` | Action type: `recording` or `verify` |
| `userplane-token`  | Authentication token                 |

Example: `https://yoursite.com?userplane-action=recording&userplane-token=abc123`

You can override URL parsing with `parseUserplaneData` in initialize options.

## Workspace Configuration

The SDK reads workspace IDs from either:

**Meta tag** (used by default when `workspaceId` is not passed):

```html
<meta name="userplane:workspace" content="ws_xxx" />
```

**Programmatic** (via initialize options):

```typescript
userplane.initialize({ workspaceId: 'ws_xxx' });

// Multiple workspaces
userplane.initialize({ workspaceId: ['ws_xxx', 'ws_yyy'] });
userplane.initialize({ workspaceId: 'ws_xxx,ws_yyy' });
```

## API Reference

### Functions

| Function              | Signature                                    | Returns                    |
| --------------------- | -------------------------------------------- | -------------------------- |
| `initialize`          | `(options?: InitializeOptions) => void`      | `void`                     |
| `open`                | `(token?: string) => boolean`                | `boolean`                  |
| `unmount`             | `() => void`                                 | `void`                     |
| `destroy`             | `() => void`                                 | `void`                     |
| `isInitialized`       | `() => boolean`                              | `boolean`                  |
| `isRecorderMounted`   | `() => boolean`                              | `boolean`                  |
| `isBridgeConnected`   | `() => boolean`                              | `boolean`                  |
| `getRecordingState`   | `() => RecordingState`                       | `RecordingState`           |
| `getRecordingContext` | `() => RecordingContext \| null`             | `RecordingContext \| null` |
| `getSessionId`        | `() => string \| null`                       | `string \| null`           |
| `getLinkId`           | `() => string \| null`                       | `string \| null`           |
| `getTabRef`           | `() => string \| null`                       | `string \| null`           |
| `clearTabRef`         | `() => void`                                 | `void`                     |
| `metadata`            | `(fn: MetadataFunction) => void`             | `void`                     |
| `set`                 | `(key: string, value: Serializable) => void` | `void`                     |
| `clearMetadata`       | `(keyOrType?: string) => void`               | `void`                     |

### Types

```typescript
type ActionType = 'recording' | 'verify' | 'capture';
type RecordingState = 'inactive' | 'active' | 'retained';
type MetadataFunction = () => SerializableObject;
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

interface RecordingContext {
  state: RecordingState;
  sessionInfo: RecordingSessionInfo | null;
  tabUnloadEnabled: boolean;
}

interface SerializableUserplaneData {
  token: string | null;
  action: ActionType | null;
}
```

## License

[Fair Source License v0.9](LICENSE)
