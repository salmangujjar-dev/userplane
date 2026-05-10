# Ramp

## Purpose

`apps/ramp` is a Next.js demo finance application used to exercise the Userplane SDK, recorder, metadata, feature flags, auth, and support integrations in a realistic product surface.

It is not the Userplane dashboard. It is a sample app with routes such as dashboard, expenses, cards, vendors, employees, approvals, analytics, flags, and settings.

The package name is `ramp`.

## Where It Fits

Ramp gives the SDK and integration flows a controlled host app:

- It initializes `@userplane/sdk` in `src/components/providers/UserplaneProvider.tsx`.
- It can use the workspace SDK source during development and the published SDK package in builds.
- It exposes demo API routes backed by a local SQLite database by default.
- It integrates optional Intercom and Zendesk messenger JWT routes.
- It uses Better Auth with Drizzle/LibSQL for demo authentication.

## Stack

- Framework: Next.js `16` App Router.
- UI: React `19`, Tailwind CSS `4`, Base UI, Radix UI, Lucide icons, Recharts, SWR, and local shadcn-style UI components.
- SDK: `@userplane/sdk`, resolved from workspace source in local development and from npm in production builds.
- Database: Drizzle ORM with LibSQL. Local development defaults to SQLite at `data/ramp.db`; Turso is optional.
- Auth: Better Auth with the Drizzle adapter.
- Integrations: optional Intercom and Zendesk messenger identity/JWT routes.
- Feature flags/failure testing: local feature flag service and failure injection helpers.

## Local Development

From the repository root:

```bash
make dev:ramp
```

Or from this directory:

```bash
cd apps/ramp
bun run dev
```

The app runs on `http://localhost:3002`.

The dev script sets:

```bash
USERPLANE_SDK_SOURCE=workspace
```

That mode aliases `@userplane/sdk` to `../../packages/sdk/src/index.ts` and transpiles related workspace packages through `next.config.ts`.

Useful commands:

```bash
bun run build
bun run build:production
bun run start
bun run start:production
bun run lint
bun run typecheck
```

## Environment

Start from `apps/ramp/.env.example`.

Important values:

- `NEXT_PUBLIC_RAMP_COMPANY_NAME` - company name shown in demo metadata. Defaults in code to `Spense` where read.
- `NEXT_PUBLIC_USERPLANE_WORKSPACE_ID` - workspace ID passed into the SDK provider.
- `NEXT_PUBLIC_VERIFICATION_BASE_URL` - API `/api/v1` base used by the SDK verification flow.
- `NEXT_PUBLIC_RECORDER_BASE_URL` - recorder origin used by the SDK.
- `USERPLANE_SDK_SOURCE` - `workspace` for local SDK development or `npm` for published SDK builds.
- `NEXT_PUBLIC_INTERCOM_APP_ID` and `INTERCOM_API_SECRET` - optional Intercom messenger integration/JWT route.
- `NEXT_PUBLIC_ZENDESK_KEY`, `ZENDESK_MESSAGING_SIGNING_KEY`, and `ZENDESK_MESSAGING_SIGNING_KEY_ID` - optional Zendesk messaging integration/JWT route.
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `BETTER_AUTH_TRUSTED_ORIGINS` - Better Auth settings.
- `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, and `TURSO_ALLOW_SEED_RESET` - optional remote LibSQL/Turso database settings.

Database defaults:

- If `TURSO_DATABASE_URL` is unset, Ramp uses local SQLite at `apps/ramp/data/ramp.db`.
- If `TURSO_DATABASE_URL` points at a remote LibSQL/Turso URL, `TURSO_AUTH_TOKEN` is required.
- Remote seed reset is guarded by `TURSO_ALLOW_SEED_RESET=1`.

## Key Workflows

- Auth routes: `/login`, `/signup`, and `/api/auth/[...all]`.
- Protected app routes: `/dashboard`, `/expenses`, `/expenses/[id]`, `/cards`, `/vendors`, `/employees`, `/approvals`, `/analytics`, `/flags`, and `/settings`.
- Demo APIs: budgets, cards, categories, employees, expenses, vendors, finance summaries, and feature flags under `/api/*`.
- SDK initialization: `UserplaneProvider` calls `userplane.initialize`, sets demo user identity, and attaches feature flag metadata.
- Failure testing: feature flags can inject states such as console noise or API failures for recording/debugging scenarios.
- Integration identity routes: `/api/intercom-jwt` and `/api/zendesk-jwt`.

## Important Directories

- `src/app` - App Router pages, auth routes, protected app routes, API routes, global styles, and metadata.
- `src/components` - app shell, feature-specific UI, providers, and local UI primitives.
- `src/hooks` - SWR data hooks for finance resources.
- `src/lib/api` - client helpers, pagination, and failure injection wrapper.
- `src/lib/auth.ts` and `src/lib/auth-client.ts` - Better Auth server/client setup.
- `src/lib/data` - mock finance data, summary calculations, seed data, and types.
- `src/lib/db` - database config, client, migrations, import/seed scripts, repository, and schema.
- `src/lib/feature-flags.ts` and `src/lib/feature-flag-service.ts` - feature flag definitions and runtime service.
- `src/proxy.ts` - auth gate for protected routes and API routes.
- `data/ramp.db` - local SQLite database used by default.
- `drizzle.config.ts` - Drizzle config that switches between local SQLite and Turso based on env.

## Checks

From this directory:

```bash
bun run lint
bun run typecheck
bun run build
```

Database commands:

```bash
bun run db:generate
bun run db:migrate
bun run db:seed
bun run db:reset
bun run db:studio
```

For remote Turso import:

```bash
bun run db:import-local
```

`db:import-local` requires `TURSO_DATABASE_URL` to point at Turso and copies local rows with insert-ignore behavior.

## Deployment/Release

Production commands:

```bash
bun run build:production
bun run start:production
```

The root Make target is:

```bash
make prod:ramp
```

Build and start scripts set `USERPLANE_SDK_SOURCE=npm`. When changing the SDK version used by deployed Ramp, update the pinned `@userplane/sdk` dependency in `package.json` and verify the demo against production-like env values.

Remote Turso is optional, but if production is configured with `TURSO_DATABASE_URL`, the hosting environment must also provide `TURSO_AUTH_TOKEN`.

## Related Docs

- `apps/ramp/.env.example`
- `apps/ramp/next.config.ts`
- `apps/ramp/drizzle.config.ts`
- `apps/ramp/src/lib/db/config.ts`
- `apps/recorder/README.md`
- `apps/api/README.md`
- `packages/sdk`
