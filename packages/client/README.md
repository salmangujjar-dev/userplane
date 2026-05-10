# @userplane/client

## Purpose

`@userplane/client` creates a type-safe oRPC/OpenAPI client for the Userplane API from `@userplane/contract`. It centralizes client construction, response validation, request credentials, dynamic headers, custom fetch support, error interception, and domain-specific client types.

## Import Surface

- `@userplane/client`: `createClient`, `ClientConfig`, `ClientContext`, `contract`, `Contract`, oRPC client inference helpers, safe-client helpers, oRPC error utilities, and domain-specific client/contract types.

## Consumers

No sibling package currently depends on `@userplane/client` at package level. It is intended for applications and integrations that call the Userplane API.

## Quick Start

```ts
import { createClient } from '@userplane/client';

const client = createClient({
  url: 'https://api.userplane.io/api/v1',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const status = await client.status.get();
```

Dynamic headers and per-request context:

```ts
const client = createClient({
  url: () => `${window.location.origin}/api/v1`,
  headers: ({ context }) => context?.headers ?? {},
  onError: (error) => {
    console.error(error);
  },
});

await client.session.init(
  { body: { linkId: 'link_123' } },
  { context: { headers: { 'x-request-id': requestId } } }
);
```

## Architecture

- `src/index.ts` constructs an `OpenAPILink` from `@userplane/contract`, adds `ResponseValidationPlugin`, wraps `fetch` with default `credentials: 'include'`, and returns `createORPCClient(link)`.
- `src/types.ts` derives domain client and contract types from the contract tree.
- The package relies on the API contract for request/response typing rather than defining endpoint shapes locally.

## Scripts

- `bun run dev`: TypeScript watch mode.
- `bun run build`: remove `dist` and compile with `tsc`.
- `bun run typecheck`: run TypeScript without emitting output.
- `bun run lint`: run ESLint.
- `bun run clean`: remove generated caches, `dist`, and `node_modules`.

## Tests/Storybook

There is no package-local test or Storybook script. Use `typecheck`, `lint`, and API integration tests in consuming apps.

## Env/Secrets

No environment variables are read directly. Callers provide API URL, headers, custom fetch implementation, credentials behavior, and error handling.

## Change Checklist

- Keep `@userplane/contract` as the source of endpoint truth.
- Check generated client type inference when changing exported type helpers.
- Preserve default `credentials: 'include'` unless all browser consumers are reviewed.
- Run `bun run --filter @userplane/client typecheck` and `lint`.

## Troubleshooting

- If endpoint types look stale, rebuild `@userplane/contract` and rerun the consumer typecheck.
- If browser auth cookies are missing, check `credentials` and CORS settings.
- If a request header is missing, inspect static headers, dynamic headers, and per-request context together.
- If response values need coercion, verify `ResponseValidationPlugin` is still installed.
