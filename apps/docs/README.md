# Docs

## Purpose

`apps/docs` is the Userplane documentation site. It contains product guides, developer docs, framework guides, integration docs, public API documentation, support pages, screenshots, OpenAPI metadata, and the Postman collection.

The package name is `docs`.

## Where It Fits

The docs app is the public reference layer for the product and API:

- Product pages explain dashboard, workspace, recording, billing, account, and support workflows.
- Developer pages document SDK installation, metadata, domain verification, redaction, framework setup, and recording data.
- API pages use `openapi:` frontmatter against `apps/docs/openapi.json`.
- Integration pages cover Chrome extension, Raycast, helpdesk integrations, MCP, and AI coding tools.
- The dashboard and API link users here through configured docs URLs.

## Stack

- Docs platform: Mintlify, configured by `docs.json`.
- Content: MDX.
- API docs: `openapi.json`, generated from `packages/contract`.
- Media: PNG/SVG assets under `media` and `static`.
- Checks: Mintlify validation and broken-link checks.

## Local Development

From the repository root:

```bash
make dev:docs
```

Or from this directory:

```bash
cd apps/docs
bun run dev
```

The package script runs:

```bash
mint dev --port 3005 --no-open
```

The local docs site is available at `http://localhost:3005`.

## Environment

This app does not have an app-specific `.env.example`. Content and navigation are driven by files in this directory:

- `docs.json` - site name, logo, favicon, API playground settings, theme, redirects, tabs, groups, and navigation.
- `openapi.json` - public API spec consumed by API reference pages.
- `static/userplane.postman_collection.json` - Postman collection artifact.

The configured API playground base URL is `https://api.userplane.io/api/v1`, and the dashboard navbar link points at `https://dash.userplane.io`.

## Key Workflows

- Add or edit pages as MDX files in the relevant content directory.
- Update `docs.json` when adding, moving, or removing pages so Mintlify navigation stays in sync.
- Add screenshots and diagrams under `media/<area>` and reference them from MDX with absolute docs paths like `/media/recorder/example.png`.
- Regenerate the API spec from the contract when public API routes or schemas change:

```bash
make generate:openapi
```

- Run docs validation before publishing:

```bash
make docs:check
```

## Important Directories

- `docs.json` - Mintlify site config, redirects, tabs, groups, and navigation.
- `introduction.mdx` and `quickstart.mdx` - top-level getting started docs.
- `getting-started` - onboarding by user role and helpdesk setup.
- `recording` and `recording-links` - capture, review, playback, sharing, projects, limits, branding, and redaction docs.
- `workspace` - workspace, team, role, project, domain, invite, access, and lifecycle docs.
- `account` - profile, notifications, connections, and leaving-workspace docs.
- `billing` - plan, usage, trial, upgrade, downgrade, and seat add-on docs.
- `developer` - SDK, installation, domain verification, metadata, redaction, recording data, and agent skills docs.
- `frameworks` and `platforms` - implementation guides by framework/platform.
- `api` - public API conceptual and endpoint pages.
- `integrations` - Chrome extension, Raycast, Intercom, Zendesk, Slack, MCP, Codex, Cursor, and Claude Code docs.
- `support` - contact and data governance docs.
- `media` - documentation screenshots and images.
- `static` - static assets and Postman collection.

## Checks

From this directory:

```bash
bun run build
bun run lint
bun run typecheck
```

`bun run build` runs `mint validate`. `bun run typecheck` intentionally prints that no typecheck is needed for Mintlify docs.

From the root:

```bash
make docs:check
```

That target runs Mintlify broken-link checks and validation using Node 22 through `fnm`.

## Deployment/Release

There is no app-local deploy script in `apps/docs/package.json`. Treat `mint validate` and `make docs:check` as the pre-release gate, then publish through the configured docs hosting flow.

When public API routes change, regenerate `openapi.json` before publishing so API reference pages and the playground match the contract.

## Related Docs

- `apps/docs/docs.json`
- `apps/docs/openapi.json`
- `apps/docs/api/introduction.mdx`
- `apps/docs/developer/installation.mdx`
- `apps/docs/integrations/chrome-extension.mdx`
- `apps/docs/integrations/raycast.mdx`
- `packages/contract`
