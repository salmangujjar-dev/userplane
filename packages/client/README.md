# @workspace/client

Type-safe API client for the Userplane API using oRPC and OpenAPI Link.

## Overview

This package provides a fully type-safe client for interacting with the Userplane API. All request and response types are validated at compile time based on the API contract, ensuring type safety throughout your application.

## Features

- **Full Type Safety**: All requests and responses are type-checked at compile time
- **Contract-Based**: Generated from `@workspace/contract` for perfect API alignment
- **Dynamic Configuration**: Support for dynamic headers and authentication
- **Error Handling**: Global and per-request error handling
- **Browser & Node.js**: Works in any JavaScript environment
- **OpenAPI Compatible**: Built on OpenAPI Link for REST API communication

## Installation

Add to your app's `package.json`:

```json
{
  "dependencies": {
    "@workspace/client": "workspace:*"
  }
}
```

Then install:

```bash
bun install
```

## Quick Start

### Basic Usage

```typescript
import { createClient } from '@workspace/client';

const client = createClient({
  url: 'http://localhost:3000/api/v2',
});

const session = await client.session.init({
  token: 'session-token',
});
```

### With Static Authentication

```typescript
const client = createClient({
  url: 'http://localhost:3000/api/v2',
  headers: {
    Authorization: 'Bearer your-token-here',
  },
});
```

### With Dynamic Authentication

```typescript
const client = createClient({
  url: 'http://localhost:3000/api/v2',
  headers: async ({ context }) => {
    const token = await getAuthToken();
    return { Authorization: `Bearer ${token}` };
  },
});
```

## Configuration Options

```typescript
interface ClientConfig {
  url: string | (() => string);
  headers?:
    | Record<string, string>
    | ((params: {
        context?: ClientContext;
      }) => Record<string, string> | Promise<Record<string, string>>);
  fetch?: (request: Request | string, init?: RequestInit) => Promise<Response>;
  credentials?: RequestCredentials;
  onError?: (error: unknown) => void;
}
```

## Available Endpoints

### Session Management

```typescript
const session = await client.session.init({ token: 'token' });

const upload = await client.session.upload.init({
  recording_duration: 120000,
  files: [{ name: 'video.webm', type: 'video', size: 1024, mime_type: 'video/webm' }],
  metadata: {
    /* ... */
  },
});

await client.session.upload.complete({
  recording_id: 'id',
  state: 'completed',
});
```

### Workspace Management

```typescript
const workspaces = await client.workspace.list();
const workspace = await client.workspace.getById({ workspaceId: 'id' });
await client.workspace.updateName({ workspaceId: 'id', name: 'New Name' });
```

### Project Management

```typescript
const projects = await client.project.list({ workspaceId: 'id' });
const project = await client.project.create({ workspaceId: 'id', name: 'Project' });
```

### Link Management

```typescript
const links = await client.link.list({ projectId: 'id' });
const link = await client.link.create({ projectId: 'id', name: 'Link' });
```

### Recording Management

```typescript
const recordings = await client.recording.list({ projectId: 'id' });
const recording = await client.recording.getById({ recordingId: 'id' });
const video = await client.recording.resources.video({ recordingId: 'id' });
```

## Advanced Usage

### Per-Request Context

```typescript
const result = await client.session.init(
  { token: 'session-token' },
  {
    context: {
      headers: { 'X-Request-ID': 'unique-id' },
    },
  }
);
```

### Custom Fetch with Logging

```typescript
const client = createClient({
  url: 'http://localhost:3000/api/v2',
  fetch: async (request, init) => {
    const url = typeof request === 'string' ? request : request.url;
    console.log(`Request: ${init?.method || 'GET'} ${url}`);
    const response = await globalThis.fetch(request, init);
    console.log(`Response: ${response.status}`);
    return response;
  },
});
```

### Global Error Handling

```typescript
const client = createClient({
  url: 'http://localhost:3000/api/v2',
  onError: (error) => {
    console.error('API Error:', error);
  },
});
```

### Browser Environment

```typescript
const client = createClient({
  url: () => {
    if (typeof window === 'undefined') {
      throw new Error('Client-side only');
    }
    return `${window.location.origin}/api/v2`;
  },
  credentials: 'include',
});
```

## Type Utilities

Extract and use types from the client:

```typescript
import type {
  UserplaneClient,
  InferClientInputs,
  InferClientOutputs,
  InferClientErrors,
  SessionClient,
  WorkspaceClient,
} from '@workspace/client';

type Inputs = InferClientInputs<UserplaneClient>;
type SessionInput = Inputs['session']['init'];

type Outputs = InferClientOutputs<UserplaneClient>;
type SessionOutput = Outputs['session']['init'];
```

## Documentation

- **[USAGE.md](./USAGE.md)** - Comprehensive usage guide with examples
- **[PACKAGE_INFO.md](./PACKAGE_INFO.md)** - Package structure and technical details
- **[src/example.ts](./src/example.ts)** - Code examples for various use cases

## Important Notes

1. **JSON Serialization**: All data is serialized as JSON. Dates become strings, binary data requires special handling.

2. **CORS Requirements**: For browser usage, your API must include `Content-Disposition` in `Access-Control-Expose-Headers`.

3. **Type Safety**: Invalid requests fail at compile time, not runtime. This catches bugs early in development.

4. **Error Handling**: API errors are thrown as exceptions. Always use try/catch or configure `onError`.

## Related Packages

- `@workspace/contract` - API contract definitions
- `@workspace/auth` - Authentication utilities

## Build Commands

```bash
bun run dev         # Development mode with watch
bun run build       # Build the package
bun run typecheck   # Type check without building
bun run clean       # Clean build artifacts
```

## License

Private package for Userplane internal use.
