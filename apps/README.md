# Apps

## Purpose

This directory contains the runnable applications in the Userplane monorepo. The apps cover the API server, customer dashboard, public documentation, marketing site, recorder, browser extension, Raycast extension, and the Ramp demo application used for SDK and integration testing.

Use this README as the index for app ownership, ports, and local commands. Each app has its own README with deeper setup notes.

## Where It Fits

The apps are workspace packages under the root `package.json` `workspaces` entry (`apps/*`). They consume shared packages from `packages/*` and are orchestrated by Turbo.

| App              | Package                | Role                                                                                                    | Local port          |
| ---------------- | ---------------------- | ------------------------------------------------------------------------------------------------------- | ------------------- |
| `apps/api`       | `@userplane/api`       | Hono/Bun API, auth, webhooks, public API, MCP endpoint, background job handlers                         | `3001`              |
| `apps/dash`      | `dash`                 | Main Next.js dashboard for accounts, workspaces, recordings, links, settings, billing, and integrations | `3000`              |
| `apps/docs`      | `docs`                 | Mintlify documentation site and API docs                                                                | `3005`              |
| `apps/home`      | `home`                 | Astro marketing, legal, blog, pricing, help, and SEO pages                                              | `4321`              |
| `apps/extension` | `@userplane/extension` | WXT Chrome extension with side panel, background worker, context menus, and omnibox command             | `3010` dev server   |
| `apps/recorder`  | `recorder`             | Next.js recorder and verification app embedded by the SDK                                               | `4322`              |
| `apps/raycast`   | `userplane`            | Raycast Store extension for creating links and browsing links/recordings                                | Raycast dev runtime |
| `apps/ramp`      | `ramp`                 | Next.js demo app for SDK, helpdesk, auth, feature flag, and failure-mode workflows                      | `3002`              |

## Stack

- Runtime and package manager: Bun `1.3.13`, with Node `>=24 <25` expected at the repo root.
- Orchestration: Turbo `2.x` tasks from `turbo.json`.
- Web apps: Next.js `16`, Astro `6`, Mintlify, WXT, and Raycast.
- Shared code: internal `@userplane/*` packages for auth, client contracts, UI, storage, pricing, SDK, logger, and shared utilities.
- Checks: ESLint, TypeScript, framework-specific validators, and Prettier.

## Local Development

Install dependencies from the repository root:

```bash
bun install
```

Common root commands:

```bash
bun run dev
bun run build
bun run lint
bun run format:check
```

Useful Make targets:

```bash
make dev
make dev:extras
make dev:api
make dev:dash
make dev:docs
make dev:extension
make dev:home
make dev:recorder
make dev:ramp
make raycast:dev
```

`make dev` runs the core apps and excludes docs and the Chrome extension. `make dev:extras` runs the full Turbo dev graph. App-specific commands are also available from each app directory, for example `cd apps/dash && bun run dev`.

## Environment

Most apps have `.env.example`, `.env.development`, and `.env.production` files. Start from the app-specific `.env.example`, then check the app README and env schema before adding values.

Important naming conventions:

- Next.js browser-visible env uses `NEXT_PUBLIC_*`.
- Astro browser-visible env uses `PUBLIC_*`.
- WXT env uses `WXT_*`.
- The API reads server-side env directly through `apps/api/src/env/schema.ts`.
- Ramp defaults to local SQLite at `apps/ramp/data/ramp.db`; Turso is optional and only required when `TURSO_DATABASE_URL` points at a remote LibSQL/Turso database.

Do not commit real secrets. The checked-in examples are templates, not production config.

## Key Workflows

- Recorder link creation starts in dashboard, Chrome extension, Raycast, or public API, then sends a user to the recorder app.
- Recorder capture and verification call the API session and domain endpoints.
- Dashboard and extension clients use the API contract through `@userplane/client`.
- Public docs use MDX pages plus `apps/docs/openapi.json`, generated from `packages/contract`.
- Ramp exercises the SDK and support integrations against a seeded demo finance app.
- API background workflows are served through the Inngest route mounted by `apps/api`.

## Important Directories

- `apps/api` - API server, route implementations, services, webhooks, MCP endpoint, and Inngest handlers.
- `apps/dash` - dashboard App Router pages, feature hooks, shared dashboard components, and Storybook.
- `apps/docs` - Mintlify `docs.json`, MDX pages, media, OpenAPI artifact, and Postman collection.
- `apps/home` - Astro pages, content collections, constants, layouts, SEO helpers, and OG image rendering.
- `apps/extension` - WXT entrypoints, side panel routes, background worker, API feature hooks, and extension UI.
- `apps/recorder` - Next.js recorder routes, bridge code, capture/recording/verification flows, and upload services.
- `apps/raycast` - Raycast command files, hand-written API client, preferences, assets, metadata, and Store docs.
- `apps/ramp` - Next.js demo routes, local database, seed data, API routes, and SDK providers.

## Checks

Root-level checks:

```bash
bun run lint
bun run format:check
bun run build
```

Targeted checks can be run per app:

```bash
cd apps/<app>
bun run lint
bun run typecheck
bun run build
```

Some apps have app-specific checks:

- `apps/docs`: `bun run build` runs `mint validate`.
- `apps/home`: `bun run typecheck` runs `astro check`.
- `apps/raycast`: `bun run lint`, `bun run typecheck`, and `bun run build` run Raycast tooling.
- `apps/extension`, `apps/dash`, and `apps/recorder`: Storybook commands exist for component work.

## Deployment/Release

- API, dash, recorder, and Ramp have production build/start scripts in their package files and Make targets such as `make prod:api`, `make prod:dash`, `make prod:recorder`, and `make prod:ramp`.
- Home deploys through Cloudflare Pages via `apps/home` scripts and `make deploy:home` / `make deploy:home:production`.
- Docs are validated with Mintlify before publishing from the docs hosting flow.
- Chrome extension builds and zips through WXT; Store submission uses `.env.submit` values.
- Raycast release uses the Raycast CLI and requires the committed `apps/raycast/package-lock.json`.

## Related Docs

- `apps/api/README.md`
- `apps/dash/README.md`
- `apps/docs/README.md`
- `apps/home/README.md`
- `apps/extension/README.md`
- `apps/recorder/README.md`
- `apps/raycast/README.md`
- `apps/ramp/README.md`
