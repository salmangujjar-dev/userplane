# @userplane/auth

## Purpose

`@userplane/auth` centralizes Userplane authentication setup on top of Better Auth. It wires database-backed auth, Google OAuth, magic links, email verification, admin roles, optional account deletion hooks, feature flag behavior, and optional MCP OAuth provider support.

The package exposes separate server and client entrypoints so browser code can avoid importing Better Auth server dependencies.

## Import Surface

- `@userplane/auth`: server-oriented exports including `createAuth`, `APIError`, MCP OAuth scope constants, role exports, feature flag helpers, role/permission types, and Better Auth MCP/OAuth helpers.
- `@userplane/auth/client`: `createAuthClientInstance`, `AuthClientConfig`, and `AuthClient` for Better Auth client creation.
- `@userplane/auth/permissions-client`: client-safe permission constants (`adminPermissions`, `csmPermissions`, `userPermissions`, `rolePermissionsMap`) and permission types.

Do not import `@userplane/auth` in browser code unless the consumer is intentionally bundling server-only Better Auth and database code.

## Consumers

No other package currently depends on `@userplane/auth` at package level. It is intended for app/server auth routes and browser surfaces that need the client or permission-only subpaths.

## Quick Start

Server setup:

```ts
import { createAuth } from '@userplane/auth';
import { getDb } from '@userplane/db';

const auth = createAuth({
  database: getDb({ databaseUrl: process.env.DATABASE_URL! }),
  secret: process.env.AUTH_SECRET!,
  baseURL: process.env.AUTH_BASE_URL!,
  trustedOrigins: ['https://dash.userplane.io'],
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  },
  email: {
    sendVerificationEmail: async (data) => {
      await sendVerificationEmail(data);
    },
    sendMagicLink: async (data) => {
      await sendMagicLink(data);
    },
  },
});
```

Browser setup:

```ts
import { createAuthClientInstance } from '@userplane/auth/client';
import { rolePermissionsMap } from '@userplane/auth/permissions-client';

const authClient = createAuthClientInstance({
  baseURL: 'https://api.userplane.io',
});

const userPermissions = rolePermissionsMap.user;
```

## Architecture

- `src/index.ts` builds the Better Auth server instance and owns server exports.
- `src/client.ts` builds the Better Auth browser client with admin and magic-link client plugins.
- `src/permissions.ts` defines server-side access control roles.
- `src/permissions-client.ts` mirrors role permission maps without server-only imports.
- `src/hooks.ts` holds user creation and auth middleware hooks.
- `src/flags.ts` exposes feature flag helpers that can be configured through `createAuth`.

`createAuth` receives dependencies explicitly: database client, auth secret, base URL, origins, Google OAuth settings, email callbacks, optional deletion callbacks, optional feature flags, and optional MCP OAuth pages/resource URL.

## Scripts

- `bun run build`: compile with `tsc`.
- `bun run dev`: compile in watch mode.
- `bun run lint`: run ESLint with zero warnings.
- `bun run lint:fix`: apply ESLint fixes.
- `bun run typecheck`: run TypeScript without emitting output.

## Tests/Storybook

There is no package-local test or Storybook script. Use `typecheck`, `lint`, and integration coverage from the app that mounts the auth routes.

## Env/Secrets

The package does not load `.env` files itself, but `createAuth` needs callers to pass secret-bearing config:

- Auth secret via `secret`.
- Database client from `@userplane/db`.
- Google OAuth client ID and secret.
- Email delivery callbacks for verification and magic links.
- Optional cookie domain, admin user IDs, and MCP OAuth URLs.

If `nodeEnv` is not passed, `createAuth` falls back to `process.env.NODE_ENV`.

## Change Checklist

- Keep browser-safe exports in `client` or `permissions-client`; do not add server imports there.
- Update role maps in server and client-safe files together when permissions change.
- Check Better Auth plugin configuration when changing auth flows.
- Verify cookie and trusted-origin changes in the app environment that owns the route.
- Run `bun run --filter @userplane/auth typecheck` and `bun run --filter @userplane/auth lint`.

## Troubleshooting

- If browser bundles pull in database or Better Auth server code, check for imports from `@userplane/auth` instead of `@userplane/auth/client` or `@userplane/auth/permissions-client`.
- If OAuth callbacks fail, verify `baseURL`, `trustedOrigins`, Google redirect URI, and cookie domain together.
- If disposable email or normalization behavior seems wrong, check the `featureFlags` passed to `createAuth`.
- If MCP OAuth metadata changes, verify `MCP_AUTH_SERVER_SCOPES` and `MCP_PROTECTED_RESOURCE_SCOPES` before changing discovery routes.
