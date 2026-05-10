# API

## Purpose

`apps/api` is the Userplane backend service. It serves authenticated product APIs, public API-key endpoints, recorder session endpoints, auth routes, billing webhooks, integration callbacks, MCP traffic, and background job hooks.

The package name is `@userplane/api`.

## Where It Fits

The API is the shared backend for:

- `apps/dash`, which uses cookie-based auth and dashboard routes.
- `apps/recorder`, which initializes recording sessions, uploads resources, and verifies domains.
- `apps/extension`, which talks to the API with browser credentials.
- `apps/raycast`, which uses public API-key endpoints.
- `apps/docs`, which documents the public API from the generated OpenAPI artifact.
- Support integrations including Intercom, Zendesk, Slack, billing webhooks, and MCP clients.

The server mounts oRPC contract implementations under `/api/v1/*`, with explicit Hono routes for auth, webhooks, integration handlers, file uploads, MCP, and development API docs.

## Stack

- Runtime: Bun.
- HTTP framework: Hono.
- API contracts: `@orpc/server`, `@orpc/openapi`, `@userplane/contract`, and `@userplane/client`.
- Auth: `@userplane/auth` and Better Auth OAuth provider metadata.
- Persistence and services: `@userplane/db`, repositories under `src/repositories`, and service modules under `src/services`.
- Background jobs: Inngest served from `/api/inngest`.
- Integrations: Dodo Payments, Intercom, Slack, Zendesk, Unkey, PostHog, Cloudflare R2, and Upstash Redis.
- Validation: Zod schemas in `src/env` and route contracts from shared packages.

## Local Development

From the repository root:

```bash
make dev:api
```

Or from this directory:

```bash
cd apps/api
bun run dev
```

The dev script runs:

```bash
env -u DATABASE_URL bun --env-file=.env.development --watch src/index.ts
```

Default server values come from `src/env/defaults.ts`:

- Host: `0.0.0.0`
- Port: `3001`

Useful local commands:

```bash
bun run dev:hot
bun run dev:inngest
bun run build
bun run start
bun run lint
bun run typecheck
```

In development, the API also exposes:

- `/spec.json` - generated OpenAPI spec from the live router.
- `/docs` - Scalar API reference UI backed by `/spec.json`.

## Environment

Start from `apps/api/.env.example` and keep local values in `.env.development`. The environment is parsed and transformed by `src/env/schema.ts`, `src/env/parse.ts`, and `src/env/index.ts`.

Important groups:

- Server and CORS: `PORT`, `HOST`, `NODE_ENV`, `APP_ENV`, `CORS_ORIGINS`, `CORS_CREDENTIALS`, `CORS_MAX_AGE`.
- Auth: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `BETTER_AUTH_COOKIE_PREFIX`, `BETTER_AUTH_COOKIE_DOMAIN`, `JWT_ISSUER`, OAuth redirect settings, and provider credentials.
- Database: `DATABASE_URL`.
- Dashboard and recorder URLs: `INVITE_APP_URL`, `RECORDER_URL`, `DOCS_URL`.
- Tokens: invite, domain verification, access request, workspace create invite, recorder, session, upload, and share token secrets/expiries.
- Storage/media: `ASSETS_DOMAIN`, `CDN_DOMAIN`, Cloudflare image transform settings, and R2 bucket credentials for CDN, assets, and reports.
- Billing: Dodo Payments keys, webhook secret, environment, product IDs, add-on IDs, and trial settings.
- Cache/rate limits: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `CACHE_ENABLED`, and `RATE_LIMIT_ENABLED`.
- Integrations: Intercom, Zendesk, Slack, PostHog, Unkey, and MCP/OpenAI verification values.
- Internal calls: `INTERNAL_API_KEY` for server-to-server calls such as dashboard to API.

Production must not use development secret defaults. `src/env/index.ts` validates known dev secret values and throws for production misconfiguration.

## Key Workflows

- Status and health: public status procedures under `/api/v1`, plus app-level health-style handlers.
- Auth: Better Auth routes mounted at `/api/auth/*`, OAuth discovery under `/.well-known/*`, and OAuth 2.1 dynamic client registration handling.
- Dashboard APIs: account, workspace, project, domain, link, recording, billing, diagnostics, admin, share, and MCP connection procedures in `src/routes`.
- Recorder session flow: session initialization and upload management through the session route implementation, with recorder tokens and upload/session token headers.
- Public API: API-key-authenticated endpoints under `/api/v1/public/*` for workspaces, projects, domains, links, recordings, and search.
- Webhooks and integrations: billing webhook at `/api/webhooks/billing`, Intercom Canvas routes, Slack events/interactions/commands, Zendesk connect/app/session routes, and workspace logo upload.
- MCP: OAuth-protected Streamable HTTP endpoint at `/mcp`, with discovery metadata under `/.well-known/*`.
- Background jobs: Inngest route at `/api/inngest` and function definitions under `src/inngest/functions`.

## Important Directories

- `src/index.ts` - Hono app setup, middleware, route mounting, CORS, body limits, rate limiting, dev docs, 404, and error handling.
- `src/routes` - oRPC route implementations grouped by domain and composed in `api.router.ts`.
- `src/services` - business logic for workspaces, links, recordings, billing, integrations, notifications, tokens, and admin flows.
- `src/repositories` - data access modules.
- `src/middleware` - auth, workspace, API-key, rate-limit, and signature middleware.
- `src/handlers` - non-oRPC HTTP handlers for webhooks, integrations, logo upload, and OAuth helper flows.
- `src/inngest` - background job client, functions, and serve handler.
- `src/mcp` - MCP server setup, tool registration, resources, and responses.
- `src/env` - env defaults, schemas, parsing, transformation, and validation.
- `src/clients` - configured clients for auth, database, storage, Redis, email, Dodo, Intercom, Slack, media, and Zendesk.
- `src/posthog` - analytics, error capture, and feature flags.

## Checks

From this directory:

```bash
bun run lint
bun run typecheck
bun run build
```

From the repo root:

```bash
make build:api
```

## Deployment/Release

Production commands:

```bash
bun run build
bun run start:production
```

The Make target is:

```bash
make prod:api
```

The build bundles `src/index.ts` to `dist` for Bun, keeps `inngest` external, and uploads PostHog source maps when `POSTHOG_PERSONAL_API_KEY` and `POSTHOG_PROJECT_ID` are set. Production env must include real secrets, storage, database, cache/rate-limit, payment, and integration values needed for enabled workflows.

## Related Docs

- `apps/api/.env.example`
- `apps/api/src/env/schema.ts`
- `apps/api/src/index.ts`
- `apps/api/src/routes/api.router.ts`
- `apps/docs/api/introduction.mdx`
- `packages/contract`
- `packages/client`
- `packages/auth`
- `packages/db`
