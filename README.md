<div align="center">
  <h1>Userplane</h1>

  <p><strong>The open-source Loom alternative built for customer support.</strong></p>

  <p>
    Send customers one recording link. Get back the session replay, console logs,
    network requests, customer notes, metadata, and other session details your
    team needs to resolve issues without the back-and-forth.
  </p>

  <p>
    <a href="https://userplane.io"><strong>Website</strong></a>
    |
    <a href="https://dash.userplane.io"><strong>Dashboard</strong></a>
    |
    <a href="https://docs.userplane.io"><strong>Docs</strong></a>
    |
    <a href="https://userplane.io/demo"><strong>Demo</strong></a>
    |
    <a href="https://docs.userplane.io/api/introduction"><strong>API Reference</strong></a>
    |
    <a href="#contributing"><strong>Contributing</strong></a>
  </p>
</div>

![Userplane dashboard overview](apps/docs/media/recordings/recordings-list.png)

## Table of contents

**Product**

- [Why this exists](#why-this-exists)
- [The information gap in support](#the-information-gap-in-support)
- [How Userplane works](#how-userplane-works)
- [How Userplane compares](#how-userplane-compares)
- [What you get with a recording](#what-comes-back-with-a-recording)
- [Recording playback and analysis](#recording-playback--analysis)
- [Support workflows and integrations](#support-workflows-and-integrations)
- [Privacy, control, and trust](#privacy-control-and-trust)
- [Built for every team that touches support](#built-for-every-team-that-touches-support)

**Developer Guide**

- [Developer platform and AI debugging](#developer-platform-and-ai-debugging)
- [Repo structure](#what-lives-in-this-repo)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Common commands](#common-commands)
- [Environment and services](#environment-and-services)

**Reference**

- [Documentation map](#documentation-map)
- [Reader paths](#reader-paths)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## Why this exists

A customer reports a bug. Support asks for steps to reproduce. Customer success asks for screenshots. Engineering asks for console logs. By the time everyone has enough context to investigate, the customer has explained the same problem three different ways.

Bug reports lose the details that actually matter: what the customer saw, what they clicked, what failed, and what they expected to happen.

Userplane gives your team all of that in a single recording link. Customers record the issue in their browser and your team gets the video, console logs, network requests, user actions, metadata, and customer notes—all attached to the same recording.

## The information gap in support

Support teams don't have a response-time problem. They have an information problem.

Most bug reports are incomplete by the time they reach the people who can fix them. Customers describe symptoms. Support tries to gather context. Engineering guesses at reproduction steps. Everyone spends more time collecting information than solving the actual issue.

Userplane eliminates that back-and-forth. When a customer encounters a problem, they record it. The recording becomes a complete case file that your team can replay, inspect, and debug without asking for screenshots, console logs, or another explanation.

## What you get with a recording

Each recording is a complete case file. Video plus the surrounding session context that makes the issue understandable and actionable.

| Context          | Why it matters                                                                   |
| :--------------- | :------------------------------------------------------------------------------- |
| Screen video     | See the exact user journey and visual state.                                     |
| Console logs     | Catch JavaScript errors, warnings, and debug output.                             |
| Network requests | Inspect failed requests, status codes, timings, and API behavior.                |
| User actions     | Follow clicks, inputs, scrolls, navigation, and interaction order.               |
| Notes            | Let the customer explain what they expected or what felt wrong.                  |
| System metadata  | Browser, OS, page URL, link, project, domain, and workspace context.             |
| Custom metadata  | Attach user IDs, account IDs, plan, flags, app version, route, or any app state. |

Support gets complete context upfront. No chasing customers for details. Engineering doesn't guess from a screenshot. Customers don't need to explain technical concepts they don't have language for.

## How Userplane works

### 1. Create a recording link

![Create a Userplane recording link](apps/docs/media/links/create-link/create-link-filled.png)

Create a recording link from the dashboard, API, Chrome extension, Raycast, Intercom, Zendesk, Slack, or another support workflow. Choose the project and domain, add a ticket or customer reference, decide if the link is single-use or reusable, and send it to the customer.

![Link creation in progress](apps/docs/media/links/create-link/create-link-project-selection.png)

### 2. The customer records in browser

![Customer recording in Userplane](apps/docs/media/recorder/recording-in-progress.png)

The customer opens the link and records in their browser. No account needed. No install. No extension. They show what went wrong, add notes, and submit. Userplane captures the technical context automatically.

Recorder features: one-click start, real-time capture preview, sensitive data blur, notes and voice narration, review before upload.

![Recorder with notes](apps/docs/media/recorder/add-notes-prior-upload.png)
![Blur sensitive data toggle](apps/docs/media/recorder/recorder-toggle-blurr.png)
![Blur data example](apps/docs/media/recorder/recorder-data-blurr-in-action-part-3.png)

### 3. Your team reviews the replay

![Userplane recording detail view](apps/docs/media/recordings/recording-detail.png)

The recording lands in Userplane with video and debugging context attached. Support sees the issue through the customer's lens. Engineering inspects the technical signals. Everyone works from the same evidence.

![Recording info panel](apps/docs/media/recordings/recording-info-tab.png)

## How Userplane compares

Userplane isn't trying to replace every tool in the support stack. We built it for one thing: customer-initiated, asynchronous issue capture with technical context attached.

| Category                     | Built for                                                     | Falls short for support                                                         | What Userplane does instead                                            |
| :--------------------------- | :------------------------------------------------------------ | :------------------------------------------------------------------------------ | :----------------------------------------------------------------- |
| Loom / generic recording     | Async video, walkthroughs, internal comms                     | Video only; no logs, network requests, browser metadata, support structure      | Customer-to-team issue capture with technical context              |
| Session replay               | Passive product replay, UX research, historical analysis      | Hard to find exact session; product-bound; lacks customer narration             | Customer points directly to the issue, records what matters        |
| Developer bug tools          | QA, engineering, technical reporters, Jira/Linear             | Assumes technical reporter understanding; starts in engineering tools           | Non-technical customers record from simple support-native flow     |
| Support-platform video       | Helpdesk coverage, live calls, screen share add-ons           | Often synchronous, generic, light on debugging context                          | Async diagnostic capture in support workflows                      |
| Screenshots                  | Static visual bugs and quick annotations                      | Misses sequence, timing, user actions, what led to the state                    | Captures full path to issue, not just final frame                  |
| APM / error monitoring       | Exceptions, backend errors, stack traces, performance signals | Shows code-level failure, not customer-visible experience                       | Connects customer experience with browser-side signals and actions |
| Co-browsing / remote desktop | Live guidance, handholding, remote action                     | Requires scheduling, customer presence, one-to-one agent time                   | Async diagnosis: understand, not control, the customer's machine   |
| Impersonation                | Inspecting account state and configuration                    | Cannot show what happened earlier, customer's browser, timing, external context | Captures sequence from customer's actual environment               |

Userplane is for when a customer says "something broke" and your team needs to see what happened, what failed, and what belongs with the ticket.

## Capabilities at a glance

| Capability           | What you get                                   | Impact                                          |
| :------------------- | :--------------------------------------------- | :---------------------------------------------- |
| Screen recording     | Customer's exact browser experience            | See the full journey, not just final state      |
| Console logs         | JavaScript errors, warnings, debug output      | Catch bugs that aren't visible on screen        |
| Network analysis     | Failed requests, status codes, timings         | Understand API failures and performance issues  |
| User actions         | Timeline of clicks, scrolls, inputs            | Follow customer intent and interaction sequence |
| Metadata             | Browser, OS, URL, custom app state             | Complete context for reproduction               |
| Issue analyzer       | AI-powered root cause detection                | Surface problems automatically                  |
| Team sharing         | Role-based access, expiry controls             | Keep recordings secure and organized            |
| Integrations         | Slack, Zendesk, Intercom, Raycast, Claude Code | Stay in your existing workflow                  |

## Recording playback and analysis

Synchronized playback of video with debugging context.

**Video player:** Full browser replay with frame controls, console/network/action overlay, audio narration, and speed controls.

![Recording playback screen](apps/docs/media/playback/media/player-playback-screen.png)

**Console inspection:** JavaScript errors, warnings, and debug logs in chronological order. Stack traces, source references, error grouping, and source maps for minified code.

![Console logs tab](apps/docs/media/recordings/recording-console-tab.png)

**Network analysis:** HTTP request and response inspection, status codes, response times, failed request highlighting, and waterfall timing.

![Network panel detail view](apps/docs/media/playback/network/network-panel-detail-view.png)

**User actions timeline:** Clicks, inputs, scrolls, and navigation events. Timestamp-aligned with video and logs, filterable by type.

![User actions detail view](apps/docs/media/playback/actions/actions-detail-view.png)

**Recording metadata:** System context (browser, OS, URL, viewport) and custom metadata (user IDs, account context, app state). All copyable.

![Recording metadata expanded](apps/docs/media/recordings/recording-metadata-expanded.png)

**Sharing:** Share with team or external stakeholders. Set expiry dates, choose view-only or full-access modes, track collaborators.

![Share recording options](apps/docs/media/recordings/share-recording-options.png)
![Share with teammates](apps/docs/media/recordings/share-teammates.png)

## Getting started and onboarding

Guided setup for workspaces, integrations, and team invitations.

- Workspace setup: name, settings, domain, project, and integration config during onboarding
- Team invitations with role assignment from day one
- Account profile, notification preferences, and multi-workspace switching

![Onboarding settings preview](apps/docs/media/onboarding/post-onboarding-settings-preview.png)
![Accept workspace invite](apps/docs/media/onboarding/accept-workspace-invite.png)

## Recording links and projects

Single-use or reusable links with custom branding, form fields, expiry controls, and domain preferences. Projects grouped by product or feature area with retention policies and team-level access.

![Project creation](apps/docs/media/projects/create-project-dialog.png)
![Project retention config](apps/docs/media/projects/project-retention-dropdown.png)

## Support workflows and integrations

![Userplane integrations overview](apps/docs/media/workspace/integrations/integrations-overview.png)

### Helpdesk and communication

**Intercom:** Create links from conversations, notifications, macros, and shortcuts.

![Intercom onboarding](apps/docs/media/intercom/intercom-oauth/intercom-onboarding-kickoff.png)

**Zendesk:** Sidebar, ticket editor, top bar, and notifications.

![Zendesk workspace selector](apps/docs/media/zendesk/zendesk-oauth/zendesk-workspace-selector.png)

**Slack:** Commands, shortcuts, home feed, and notifications.

![Slack home browse links](apps/docs/media/slack/home/home-browse-links.png)

**Raycast:** Create links, browse recordings, manage from your command palette.

![Raycast create link](apps/docs/media/raycast/create-link.png)
![Raycast browse recordings](apps/docs/media/raycast/browse-recordings.png)

**Chrome extension:** Side panel, create and manage links, browse recordings, shortcuts in any tool.

![Chrome extension side panel](apps/docs/media/extension/extension-create-link.png)
![Extension list recordings](apps/docs/media/extension/extension-list-recordings.png)

### AI and development integrations

**Claude Code:** Audit, debug, integrate, and analyze recordings with Claude via MCP tools and agent skills.

**Cursor / Codex:** MCP integration and workflow automation for AI-driven analysis.

### Programmatic integration

**Public REST API:** Workspaces, projects, domains, links, recordings, users, and search. API keys, rate limiting, and pagination included.

**Webhooks and automation:** Create links from your product or backend. Integrate with Jira, Linear, and other issue trackers.

## Privacy, control, and trust

![Userplane privacy and security controls](apps/docs/media/recorder/recorder-data-blurr-in-action-part-1.png)

Recording customer sessions is powerful, so the capture surface needs controls. Userplane includes workspace, domain, project, link, sharing, retention, and capture preferences that help teams collect useful context without collecting everything.

**Data capture controls:** Configure what a domain can capture (screen, audio, console, network). Blur sensitive fields before recording (credit cards, passwords, SSNs). Set up redaction rules per field type or custom pattern. Customers control what gets recorded from the recorder UI.

**Access and sharing:** Workspace membership and roles. Invite policies (public, protected, private). Recording sharing with expiry controls. View-only or full-access modes. Collaborator tracking.

**Data lifecycle:** Retention policies per project. Automatic deletion. Manual archival. Export options. Compliance reporting.

## Built for every team that touches support

| Team               | What they need                                                | How Userplane helps                                                                                         |
| :----------------- | :------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------- |
| Support agents     | Understand what went wrong without endless follow-up          | Request a recording, watch the replay, review user actions, keep the ticket moving with full context        |
| Support engineers  | Get to the root cause on the first look                       | Inspect console logs, network requests, runtime context, metadata, exact sequence that led to the issue     |
| Customer success   | Resolve harder-to-describe issues without forcing a live call | Customers show what happened asynchronously, keep recordings tied to accounts, workspaces, references       |
| Engineering teams  | Reproduce customer-reported bugs with evidence, not folklore  | Install SDK, attach metadata, configure redaction, receive replayable engineer-ready artifacts              |
| Support operations | Keep debugging artifacts controlled and discoverable          | Organize recordings by workspace, project, domain, link, creator, status, expiry, connected workflow        |
| AI and automation  | Analyze real customer sessions with permissioned context      | Use public API and MCP tools to inspect recordings, pull logs, review actions, summarize likely root causes |
| Product teams      | Monitor feature adoption and customer workflows               | Embed recording links in-product, attach metadata, analyze session paths                                    |

## Workspace management and security

**Team and access management:** Role-based access (admin, member, viewer). Invite policies (public, protected, private). Multiple workspace support.

![Team management interface](apps/docs/media/workspace/team/team-list.png)
![Team invite dialog](apps/docs/media/workspace/team/team-invite.png)

**Domain configuration:** Domain verification, capture preferences and security rules, domain whitelist for sensitive websites.

![Domain management list](apps/docs/media/workspace/domain/domain-list.png)
![Domain verification code](apps/docs/media/workspace/domain/domain-verification-code.png)

**Notifications:** Email notifications for recordings and team activity. Per-workspace preferences and digest options.

![Notification toggles](apps/docs/media/workspace/notification/notification-toggles.png)

## Billing and account

Usage-based pricing per recording per month, with a free trial and no credit card required.

- Starter, professional, and enterprise tiers with custom plans for larger teams
- Workspace-level billing, usage dashboard, and real-time tracking
- Upgrade or downgrade anytime, seat add-ons, overage controls

![Usage dashboard](apps/docs/media/billing/usage-dashboard.png)
![Plan details view](apps/docs/media/billing/workspace-plan/current-plan-details.png)

## Developer platform and AI debugging

![Userplane issue analyzer](apps/docs/media/recordings/issue-analyzer-fix.png)

### SDK and installation

- **CDN embed:** One line to add recordings to any page
- **`@userplane/sdk`:** Full programmatic control including recorder init, link creation, state inspection, metadata attachment, and redaction config
- **`@userplane/metadata`:** Standalone metadata capture without the full SDK
- Framework guides for React, Next.js, Vue, Nuxt, Angular, Svelte, SvelteKit, Solid, Remix, Astro, Django, Ruby on Rails, TanStack Start, and static HTML

![Userplane SDK on npm](apps/docs/media/developer/npm/userplane-sdk.png)

### API and automation

- **Public REST API:** Auth via API keys with rotation and revocation. Endpoints for workspaces, projects, domains, links, recordings, users, and search. OpenAPI spec and Postman collection available.
- **Webhooks:** Programmatic link creation from your app or backend. Jira/Linear integration. Usage monitoring and billing hooks.

![API key management](apps/docs/media/api/list-api-keys.png)

### AI and MCP integration

- **Userplane MCP** at `https://api.userplane.io/mcp` provides full workspace, recording, link, and domain tools for AI agents
- **Documentation MCP** at `https://docs.userplane.io/mcp` offers inline integration help
- AI-native app rendering: single-file React widgets from MCP results
- Claude Code, Cursor, and Codex integration with subagent support and agent skills

## What lives in this repo

This is a full-stack monorepo containing the complete Userplane product:

**Products:** API, dashboard, customer recorder, marketing site, public docs, Chrome extension, Raycast extension, demo app

**SDKs and libraries:** Web SDK, embed wrapper, metadata SDK, logger, privacy blur system, typed RPC bridge, shared UI components

**Infrastructure:** Database schema and migrations, data contracts, API contracts, OpenAPI spec, MCP tools, payment processing, email system, auth

**Integrations:** Intercom, Zendesk, Slack, Chrome extension, Raycast, Claude Code, Cursor, Codex, and more

```text
userplane/
|-- apps/
|   |-- api/        # Hono API, public API, auth, integrations, MCP, jobs
|   |-- dash/       # Main workspace dashboard
|   |-- docs/       # Mintlify public documentation
|   |-- extension/  # Chrome extension built with WXT
|   |-- home/       # Astro marketing site and generated markdown/OG surfaces
|   |-- ramp/       # Demo app for SDK and support workflow testing
|   |-- raycast/    # Raycast extension
|   `-- recorder/   # Customer-facing recording runtime
|-- packages/
|   |-- contract/   # oRPC contracts, Zod schemas, OpenAPI/MCP generation
|   |-- client/     # Typed API client
|   |-- db/         # Drizzle schema, migrations, database client
|   |-- sdk/        # Browser recorder SDK
|   |-- embed/      # CDN/embed wrapper around the SDK
|   |-- metadata/   # Standalone metadata registry
|   |-- logger/     # Browser capture logger
|   |-- blurr/      # Privacy blur system
|   |-- postbridge/ # Typed postMessage/RPC bridge
|   |-- ui/         # Shared UI primitives and styling
|   `-- ...         # Auth, storage, payments, email, pricing, cache, tooling
|-- developers/     # Contributor setup guides and area-specific guides
|-- assets/         # Repo-level media, including README-owned visuals
|-- scripts/        # Repo maintenance scripts
`-- .github/        # Issues, PR template, security policy, workflows
```

For the full runnable-app index, see [apps/README.md](apps/README.md). For the full shared-package index, see [packages/README.md](packages/README.md).

## Product surfaces

| Surface          | Path                                             | Purpose                                                                                      | Stack                                     | Local command                                | Port   | Guide                                             |
| :--------------- | :----------------------------------------------- | :------------------------------------------------------------------------------------------- | :---------------------------------------- | :------------------------------------------- | :----- | :------------------------------------------------ |
| API              | [apps/api](apps/api/README.md)                   | Auth, workspaces, recordings, links, billing, integrations, public API, MCP, background jobs | Bun, Hono, oRPC, Drizzle, Inngest         | `make dev:api`                               | `3001` | [API guide](developers/guides/api.md)             |
| Dashboard        | [apps/dash](apps/dash/README.md)                 | Workspace UI, links, recordings, playback, settings, billing, integrations, admin            | Next.js, React, TanStack Query            | `make dev:dash`                              | `3000` | [Dashboard guide](developers/guides/dashboard.md) |
| Recorder         | [apps/recorder](apps/recorder/README.md)         | Customer-facing recorder runtime, domain verification, hidden capture surface                | Next.js, React, MediaRecorder, PostBridge | `make dev:recorder`                          | `4322` | [Recorder guide](developers/guides/recorder.md)   |
| Docs             | [apps/docs](apps/docs/README.md)                 | Public docs, API reference, integration guides, OpenAPI, ChatGPT app submission artifact     | Mintlify, MDX                             | `make dev:docs`                              | `3005` | [Docs guide](developers/guides/docs.md)           |
| Home             | [apps/home](apps/home/README.md)                 | Marketing site, pricing, blog, framework pages, integration pages, OG images, `llms.txt`     | Astro, React islands, Tailwind, Satori    | `make dev:home`                              | `4321` | [Home guide](developers/guides/home.md)           |
| Chrome extension | [apps/extension](apps/extension/README.md)       | Side panel, create links, browse recordings, settings, context menus, omnibox                | WXT, React, TanStack Router/Query         | `make dev:extension`                         | `3010` | [Extension guide](developers/guides/extension.md) |
| Raycast          | [apps/raycast](apps/raycast/README.md)           | Create links, browse recordings/links, menu bar workflows from Raycast                       | Raycast API, TypeScript                   | `make raycast:dev`                           | n/a    | [Raycast guide](developers/guides/raycast.md)     |
| Ramp demo        | [apps/ramp](apps/ramp/README.md)                 | Realistic demo app for exercising the SDK, metadata, support widgets, and recording links    | Next.js, React, Drizzle/libSQL            | `make dev:ramp`                              | `3002` | [Ramp guide](developers/guides/ramp.md)           |
| MCP apps         | [packages/mcp-apps](packages/mcp-apps/README.md) | Single-file React widgets rendered by MCP tool results                                       | Vite, React, Apps SDK                     | `bun run --filter @userplane/mcp-apps build` | n/a    | [MCP guide](developers/guides/mcp.md)             |

## Architecture

```mermaid
flowchart LR
  Customer["Customer browser"] --> Recorder["apps/recorder"]
  SDK["@userplane/sdk / embed"] --> Recorder
  Recorder --> API["apps/api"]
  Dash["apps/dash"] --> API
  Extension["apps/extension"] --> API
  Raycast["apps/raycast"] --> PublicAPI["Public API"]
  PublicAPI --> API
  API --> Contract["@userplane/contract"]
  API --> DB["@userplane/db / Postgres"]
  API --> Storage["@userplane/storage / R2"]
  API --> Email["@userplane/email / Resend"]
  API --> Billing["@userplane/payments / DodoPayments"]
  API --> Jobs["Inngest"]
  API --> Integrations["Intercom / Zendesk / Slack"]
  API --> MCP["MCP tools + packages/mcp-apps"]
  Home["apps/home"] --> Docs["apps/docs"]
```

### Request and data flow

1. A client uses `@userplane/client`, the public API, or a direct app route.
2. Shared contracts in `@userplane/contract` define request and response shapes.
3. API routes in `apps/api` validate the request and call a service.
4. Services call repositories, storage clients, email clients, billing clients, integration clients, or Inngest.
5. Data is persisted in Postgres via `@userplane/db` and media/log artifacts are stored through `@userplane/storage`.

### Recording flow

1. A link is created with workspace, project, domain, reference, and reuse settings.
2. The customer opens a `userplane-action=recording` link with a signed token.
3. The SDK/embed or recorder runtime validates the token and opens the recorder.
4. The recorder captures screen and audio and coordinates browser context through PostBridge, logger, metadata, and blur packages.
5. Uploads complete through API session endpoints and storage presigned URLs.
6. The dashboard, API, MCP tools, and integrations review the recording and its related logs, actions, requests, notes, and metadata.

## Getting started

### Prerequisites

| Tool or service | Version / note                                                                                    |
| :-------------- | :------------------------------------------------------------------------------------------------ |
| Node.js         | `24.14.1` locally, root engine `>=24.0.0 <25.0.0`                                                 |
| Bun             | `1.3.13`                                                                                          |
| PostgreSQL      | Managed Postgres via [Neon](developers/setup/neon.md) or [Supabase](developers/setup/supabase.md) |
| cloudflared     | Needed for OAuth callbacks, webhooks, and integration testing                                     |

### Quickstart

```bash
git clone https://github.com/wizenheimer/userplane.git
cd userplane
make install
make env:setup
# edit apps/api/.env.development and set DATABASE_URL
make db:push
make dev
```

`make dev` starts the core local apps. Use focused commands when working on one surface at a time.

## Common commands

### Setup

| Command          | Purpose                                              |
| :--------------- | :--------------------------------------------------- |
| `make install`   | Install all dependencies                             |
| `make update`    | Update dependencies                                  |
| `make env:setup` | Copy `.env.example` files into development env files |
| `make env:check` | Verify expected development env files exist          |

### Development

| Command              | Purpose                                     |
| :------------------- | :------------------------------------------ |
| `make dev`           | Run the core apps                           |
| `make dev:extras`    | Run all apps including docs and extension   |
| `make dev:api`       | Run API only                                |
| `make dev:dash`      | Run dashboard only                          |
| `make dev:home`      | Run home/marketing site only                |
| `make dev:docs`      | Run Mintlify docs only                      |
| `make dev:recorder`  | Run recorder only                           |
| `make dev:extension` | Run Chrome extension dev server             |
| `make dev:ramp`      | Run Ramp demo app only                      |
| `make dev:sdk`       | Run SDK-focused toolchain plus related apps |

### Quality

| Command             | Purpose                                |
| :------------------ | :------------------------------------- |
| `make lint`         | Run linters                            |
| `make lint:fix`     | Run linters and apply fixes            |
| `make format`       | Format supported files                 |
| `make format:check` | Check formatting                       |
| `make typecheck`    | Type-check all packages and apps       |
| `make check`        | Run lint, typecheck, and format checks |
| `make fix`          | Run lint fixes and formatting          |
| `make test`         | Run available tests                    |

### Database

| Command                | Purpose                                           |
| :--------------------- | :------------------------------------------------ |
| `make db:generate`     | Generate Drizzle migrations for the main database |
| `make db:migrate`      | Apply pending main database migrations            |
| `make db:push`         | Push schema directly in development               |
| `make db:studio`       | Open Drizzle Studio                               |
| `make ramp:db:migrate` | Run Ramp demo database migrations                 |
| `make ramp:db:seed`    | Seed Ramp demo data                               |
| `make ramp:db:studio`  | Open Drizzle Studio for Ramp                      |

### Docs, code generation, and assets

| Command                                | Purpose                                      |
| :------------------------------------- | :------------------------------------------- |
| `make generate:openapi`                | Generate OpenAPI spec for docs and API reference |
| `make generate:chatgpt-app-submission` | Generate ChatGPT app submission artifact     |
| `make docs:check`                      | Validate Mintlify docs                       |
| `make assets:upload:dry-run`           | Preview R2 asset uploads                     |
| `make assets:validate`                 | Validate local and remote assets             |
| `make assets:optimize:dry-run`         | Preview image optimization savings           |

### Integrations and release helpers

| Command                     | Purpose                                     |
| :-------------------------- | :------------------------------------------ |
| `make tunnel:start`         | Start Cloudflare tunnels for local services |
| `make tunnel:status`        | Show tunnel status and URLs                 |
| `make inngest:dev`          | Run Inngest dev server                      |
| `make extension:build`      | Build Chrome extension                      |
| `make extension:zip`        | Zip Chrome extension                        |
| `make raycast:dev`          | Run Raycast extension locally               |
| `make raycast:prepublish`   | Prepare Raycast Store package lock          |
| `make package:zendesk`      | Package Zendesk manifest for development    |
| `make package:zendesk:prod` | Package Zendesk manifest for production     |

## Environment and services

Run `make env:setup` first. Each app and package owns its own `.env.example`.

| Service                   | Needed for                                           | Guide                                                                      |
| :------------------------ | :--------------------------------------------------- | :------------------------------------------------------------------------- |
| Neon or Supabase Postgres | API, dashboard, recorder, integrations               | [Neon](developers/setup/neon.md), [Supabase](developers/setup/supabase.md) |
| Cloudflare Tunnels        | OAuth callbacks, webhooks, local integration testing | [Cloudflare Tunnels](developers/setup/cloudflare-tunnels.md)               |
| Upstash Redis             | Cache and rate limiting                              | [Upstash](developers/setup/upstash.md)                                     |
| Inngest                   | Background jobs                                      | [Inngest](developers/setup/inngest.md)                                     |
| DodoPayments              | Billing and subscriptions                            | [DodoPayments](developers/setup/dodopayments.md)                           |
| Resend                    | Transactional email                                  | [Resend](developers/setup/resend.md)                                       |
| PostHog                   | Analytics and client/server telemetry                | [PostHog](developers/setup/posthog.md)                                     |
| Unkey                     | API key management                                   | [Unkey](developers/setup/unkey.md)                                         |
| Google OAuth              | Authentication                                       | [Google OAuth](developers/setup/google-oauth.md)                           |
| Cloudflare R2             | Recordings, screenshots, media assets                | [Cloudflare R2](developers/setup/cloudflare-r2.md)                         |
| Intercom                  | Intercom app and OAuth integration                   | [Intercom App](developers/setup/intercom-app.md)                           |
| Zendesk                   | Zendesk app and OAuth integration                    | [Zendesk App](developers/setup/zendesk-app.md)                             |
| Slack                     | Slack app and commands                               | [Slack App](developers/setup/slack-app.md)                                 |

## Documentation map

| Documentation    | Path or URL                                            | Purpose                                              |
| :--------------- | :----------------------------------------------------- | :--------------------------------------------------- |
| Public docs      | [https://docs.userplane.io](https://docs.userplane.io) | User-facing guides, API docs, integrations, SDK docs |
| Docs source      | [apps/docs](apps/docs/README.md)                       | Mintlify source, media references, OpenAPI reference |
| Contributor docs | [developers](developers/README.md)                     | Local setup and area-specific contribution guides    |
| App index        | [apps/README.md](apps/README.md)                       | Detailed map of runnable apps                        |
| Package index    | [packages/README.md](packages/README.md)               | Detailed map of shared packages                      |
| Contributing     | [CONTRIBUTING.md](CONTRIBUTING.md)                     | Branching, commits, PR expectations                  |
| Security         | [.github/SECURITY.md](.github/SECURITY.md)             | Vulnerability reporting                              |

## Reader paths

| If you are...                   | Start here                                                                                                                                             | Then go deeper                                                                                                                                                                                                                                                                                                      |
| :------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Evaluating Userplane            | [The Information Gap In Support](#the-information-gap-in-support), [How Userplane Compares](#how-userplane-compares)                                   | [Docs](https://docs.userplane.io), [Demo](https://userplane.io/demo), [Pricing](https://userplane.io/pricing)                                                                                                                                                                                                       |
| Using integrations              | [Support Workflows And Integrations](#support-workflows-and-integrations), [Workspace Management And Security](#workspace-management-and-security)          | [Chrome extension](https://docs.userplane.io/integrations/chrome-extension), [Slack](https://docs.userplane.io/integrations/slack), [Intercom](https://docs.userplane.io/integrations/intercom), [Zendesk](https://docs.userplane.io/integrations/zendesk), [AI agents](https://docs.userplane.io/integrations/mcp) |
| Integrating the SDK             | [Developer Platform And AI Debugging](#developer-platform-and-ai-debugging), [What You Get With A Recording](#what-comes-back-with-a-recording)     | [SDK guides](https://docs.userplane.io/developer/web-sdk), [Framework guides](https://docs.userplane.io/frameworks), [Metadata SDK](https://docs.userplane.io/developer/metadata-sdk)                                                                                                                               |
| Setting up billing and workspace  | [Workspace Management And Security](#workspace-management-and-security), [Billing And Account](#billing-and-account)                                             | [Workspace setup](https://docs.userplane.io/getting-started/workspace-setup), [Team management](https://docs.userplane.io/workspace/team-management), [Billing docs](https://docs.userplane.io/billing/overview)                                                                                                    |
| Building with the API           | [Developer Platform And AI Debugging](#developer-platform-and-ai-debugging), [Support Workflows And Integrations](#support-workflows-and-integrations) | [API quickstart](https://docs.userplane.io/api/quickstart), [API reference](https://docs.userplane.io/api/introduction), [MCP docs](https://docs.userplane.io/integrations/mcp)                                                                                                                                     |
| Contributing to the app         | [Getting Started](#getting-started), [Common Commands](#common-commands)                                                                               | [CONTRIBUTING.md](CONTRIBUTING.md), [developers/README.md](developers/README.md)                                                                                                                                                                                                                                    |
| Working on API/data             | [Architecture](#architecture), [Product Surfaces](#product-surfaces)                                                                                   | [apps/api](apps/api/README.md), [packages/contract](packages/contract/README.md), [packages/db](packages/db/README.md)                                                                                                                                                                                              |
| Working on recording capture    | [How Userplane Works](#how-userplane-works), [Developer Platform And AI Debugging](#developer-platform-and-ai-debugging)                               | [apps/recorder](apps/recorder/README.md), [packages/sdk](packages/sdk/README.md), [packages/logger](packages/logger/README.md)                                                                                                                                                                                      |
| Working on support integrations | [Support Workflows And Integrations](#support-workflows-and-integrations), [Environment And Services](#environment-and-services)                       | [apps/extension](apps/extension/README.md), [apps/raycast](apps/raycast/README.md), [apps/home](apps/home/README.md)                                                                                                                                                                                                |
| Maintaining docs or media       | [Documentation Map](#documentation-map)                                                                                                                | [apps/docs](apps/docs/README.md), [apps/home](apps/home/README.md)                                                                                                                                                                                                                                                  |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [developers/README.md](developers/README.md) for full details.

1. Branch from `main`
2. Use conventional branch names: `feat/add-slack-notifications`
3. Use conventional commits: `feat(api): add workspace member role filtering`
4. Run `make check` before opening a PR
5. Include screenshots for UI changes and docs updates for behavior changes

## Security

Please do not open public issues for vulnerabilities. Follow [.github/SECURITY.md](.github/SECURITY.md) for reporting instructions and supported scope.

## License

Userplane uses Apache-2.0 at the repository root, with workspace-specific FSL-1.1-ALv2 exceptions declared in each app and package `LICENSE.md`.
