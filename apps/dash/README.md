# Dashboard

## Purpose

`apps/dash` is the main Userplane dashboard. It gives users and admins the UI for authentication, workspace setup, domains, projects, recording links, recording review, sharing, account settings, billing, admin tools, and support integrations.

The package name is `dash`.

## Where It Fits

The dashboard is the authenticated product surface that sits between the API and end-user workflows:

- It calls `apps/api` with browser credentials and server-to-server keys where required.
- It creates recording links that open `apps/recorder`.
- It links to `apps/docs` for product and developer help.
- It configures and launches integrations such as Intercom, Zendesk, Slack, MCP connections, and browser/Raycast extensions.
- It depends on shared packages such as `@userplane/auth`, `@userplane/client`, `@userplane/contract`, `@userplane/ui`, `@userplane/storage`, `@userplane/payments`, and `@userplane/pricing`.

## Stack

- Framework: Next.js `16` App Router.
- UI/runtime: React `19`, Tailwind CSS `4`, `@userplane/ui`, Lucide icons, Sonner, Recharts, Video.js, and Zustand.
- Data: `@tanstack/react-query`, `@userplane/client`, and shared contract types.
- Forms and validation: React Hook Form, `@hookform/resolvers`, Zod, Validator.
- Analytics/error tooling: PostHog browser and Node packages, optional source map upload through `@posthog/nextjs-config`.
- Component development: Storybook on port `6020`.

## Local Development

From the repository root:

```bash
make dev:dash
```

Or from this directory:

```bash
cd apps/dash
bun run dev
```

The app runs on `http://localhost:3000`.

Useful commands:

```bash
bun run build
bun run build:production
bun run start
bun run start:production
bun run lint
bun run typecheck
bun run storybook
bun run build-storybook
```

## Environment

Start from `apps/dash/.env.example`. Runtime env is parsed through `src/env/schema.ts` and transformed in `src/env/index.ts`.

Important values:

- `NEXT_PUBLIC_API_URL` - API server origin used by dashboard clients.
- `NEXT_PUBLIC_DASHBOARD_URL` - dashboard origin.
- `NEXT_PUBLIC_HOME_URL` - home/marketing origin.
- `NEXT_PUBLIC_RECORDER_URL` - recorder origin used in link flows.
- `NEXT_PUBLIC_DOCS_URL` - docs origin for help links.
- `NEXT_PUBLIC_AUTH_COOKIE_PREFIX` - must match API auth cookie prefix.
- `NEXT_PUBLIC_CDN_DOMAIN`, `NEXT_PUBLIC_ASSETS_DOMAIN`, `NEXT_PUBLIC_CLOUDFLARE_IMAGE_ZONE`, `NEXT_PUBLIC_SKIP_IMAGE_TRANSFORM` - media rendering and Cloudflare image transform settings.
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` - optional client analytics/error tracking.
- Marketplace env values such as `NEXT_PUBLIC_ZENDESK_MARKETPLACE_APP_URL` and `NEXT_PUBLIC_*_MARKETPLACE_LIVE` - install CTA behavior.
- `INTERNAL_API_KEY` - server-only shared key for dashboard to API calls, such as Zendesk iframe resolution.
- `POSTHOG_PERSONAL_API_KEY` and `POSTHOG_PROJECT_ID` - build-time source map upload only.

`APP_ENV` controls environment-specific behavior and defaults to `development`. `next.config.mjs` loads `.env.development` or `.env.production` based on `APP_ENV`.

## Key Workflows

- Authentication and OAuth: `/auth`, `/authorize`, `/oauth/consent`, and callbacks under `/callback/intercom`, `/callback/slack`, and `/callback/zendesk`.
- Workspace lifecycle: `/workspace/create`, `/workspace/request`, `/workspace/restore`, `/workspace/suggest`, and `/workspace/[workspaceId]`.
- Workspace dashboard: workspace-scoped pages expose recordings, links, settings, domains, team, billing, projects, integrations, and account flows through route state and components.
- Recording review: recording playback, console logs, network activity, backend/actions panels, metadata, sharing, expiry, and public share links.
- Recording links: create, edit, share, reusable links, project/domain association, and link recording history.
- Domain setup: `/setup/domain` and domain verification/configuration components.
- Integrations: `/install/intercom`, `/install/zendesk`, `/zendesk/iframe`, integration settings, OAuth callbacks, and helpdesk-specific UI.
- Admin: `/admin`, `/admin/users`, `/admin/workspaces`, and `/admin/plans`.
- Public share/review surfaces: `/share/recording` and `/review/[[...slug]]`.

## Important Directories

- `src/app` - Next.js route tree, layouts, error boundaries, loading states, and route pages.
- `src/client` - API and auth client setup.
- `src/env` - dashboard env defaults, schemas, parsing, and typed config.
- `src/features` - React Query hooks, mutations, and query keys by domain.
- `src/components/accounts` - account and developer settings UI.
- `src/components/admin` - admin tools for users, workspaces, plans, impersonation, and restoration.
- `src/components/links` - link lists, previews, tabs, and filters.
- `src/components/recordings` - recording review layout, playback, logs, metadata, capture gates, and markers.
- `src/components/settings` - workspace settings sections.
- `src/components/integrations` and `src/components/zendesk` - integration-specific dashboard and iframe views.
- `src/components/player` - Video.js-based stream player.
- `src/components/modals` - dashboard modal flows.
- `src/components/navigation` - sidebar, admin navigation, headers, and recording detail nav.

## Checks

From this directory:

```bash
bun run lint
bun run typecheck
bun run build
```

For component work:

```bash
bun run storybook
bun run build-storybook
```

## Deployment/Release

Production commands:

```bash
bun run build:production
bun run start:production
```

The root Make target is:

```bash
make prod:dash
```

The production build uses `APP_ENV=production`, Next.js webpack build mode, and optional PostHog source map upload when build-time PostHog credentials are present.

## Related Docs

- `apps/dash/.env.example`
- `apps/dash/src/env/schema.ts`
- `apps/dash/src/app`
- `apps/api/README.md`
- `apps/recorder/README.md`
- `apps/docs/README.md`
- `packages/client`
- `packages/contract`
- `packages/ui`
