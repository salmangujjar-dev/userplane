# Chrome Extension

## Purpose

`apps/extension` is the Userplane Chrome extension. It lets users open a side panel from the browser, create recording links, browse recording links, browse received recordings, share links, switch workspaces, and open related dashboard pages without leaving the current tab.

The package name is `@userplane/extension`.

## Where It Fits

The extension is a browser-native companion to the dashboard:

- It authenticates against `apps/api` using the shared Better Auth session flow.
- It uses dashboard URLs for sign-in, settings, and deep links.
- It calls API routes through `@userplane/client` and `@userplane/contract`.
- It shares UI patterns with dashboard through `@userplane/ui`.
- Its integration docs and screenshots live in `apps/docs`.

## Stack

- Extension framework: WXT `0.20`.
- UI: React `19`, Tailwind CSS `4`, `@userplane/ui`, Lucide icons, and Boring Avatars.
- Routing: TanStack Router with hash history inside the side panel.
- Data: TanStack React Query, `@userplane/client`, `@userplane/contract`, and browser storage.
- Browser APIs: Chrome side panel, context menus, omnibox, commands, tabs, runtime messages, and storage.
- Analytics/error tooling: PostHog browser package and optional source map upload through the PostHog Rollup plugin.
- Component development: Storybook on port `6012`.

## Local Development

From the repository root:

```bash
make dev:extension
```

Or from this directory:

```bash
cd apps/extension
bun run dev
```

WXT dev server runs on port `3010`. Load the generated development extension from Chrome extension tooling as needed for local testing.

Useful commands:

```bash
bun run build
bun run zip
bun run submit
bun run lint
bun run typecheck
bun run storybook
bun run build-storybook
```

Root aliases also exist:

```bash
make extension:dev
make extension:build
make extension:zip
make extension:storybook
```

## Environment

Start from `apps/extension/.env.example`.

Runtime/build values:

- `WXT_API_URL` - API origin, for example `https://api-dev.userplane.io`. The client appends `/api/v1`.
- `WXT_DASH_URL` - dashboard origin for auth and deep links.
- `WXT_CDN_DOMAIN` - media CDN origin.
- `WXT_CLOUDFLARE_IMAGE_ZONE` - Cloudflare image transform zone.
- `WXT_SKIP_IMAGE_TRANSFORM` - set to `true` to serve original image URLs.
- `WXT_POSTHOG_KEY` and `WXT_POSTHOG_HOST` - optional analytics/error tracking.
- `POSTHOG_PERSONAL_API_KEY` and `POSTHOG_PROJECT_ID` - build-time source map upload only.

Chrome Web Store submission credentials live in `.env.submit` and are described by `.env.submit.example`:

- `CHROME_EXTENSION_ID`
- `CHROME_CLIENT_ID`
- `CHROME_CLIENT_SECRET`
- `CHROME_REFRESH_TOKEN`

Do not commit real submission credentials.

## Key Workflows

- Side panel routes:
  - `/` - recording links list.
  - `/create` - create recording link.
  - `/edit` - edit link route with search params.
  - `/share` - share newly created/copied link route.
  - `/recordings` - recordings list.
  - `/settings` - workspace and extension settings.
- Background worker:
  - Checks and caches auth session state.
  - Handles sign-out and auth expiry messages.
  - Registers context menu actions.
  - Opens the side panel at specific routes from context menus, omnibox, and keyboard commands.
- Chrome entrypoints:
  - `background` - service worker logic.
  - `sidepanel` - main product UI.
  - `options` - options page shell.
- User actions:
  - Action context menu opens create link, links list, recordings list, and help.
  - Page context menu opens create link.
  - Omnibox keyword is `userplane`.
  - Command is `create-recording-link`, defaulting to `Command+Shift+Y` on macOS and `Ctrl+Shift+Y` elsewhere.

## Important Directories

- `wxt.config.ts` - manifest, permissions, host permissions, commands, omnibox, side panel path, dev server, and build plugins.
- `src/entrypoints/background` - service worker and Chrome API event handling.
- `src/entrypoints/sidepanel` - side panel app, router, and HTML entrypoint.
- `src/entrypoints/options` - options app entrypoint.
- `src/client` - API client setup.
- `src/features` - API queries/mutations and query keys by domain.
- `src/components` - auth guard, layouts, links, recordings, create/edit/share flows, settings, filters, and shared UI.
- `src/lib` - auth client, errors, media helpers, messaging, PostHog, and storage.
- `src/hooks` - search, debounce, auth, favicon, and intersection helpers.
- `public` - extension icons and logos.
- `.storybook` - Storybook setup and mocks.

## Checks

From this directory:

```bash
bun run lint
bun run typecheck
bun run build
```

For UI work:

```bash
bun run storybook
bun run build-storybook
```

## Deployment/Release

Build and zip:

```bash
bun run build
bun run zip
```

Root targets:

```bash
make extension:build
make extension:build:prod
make extension:zip
make extension:zip:prod
```

Chrome Web Store submission:

```bash
make extension:submit
```

The submit target zips the production build, then runs `wxt submit` with the generated Chrome zip. Use `make extension:submit:dry` to authenticate and validate without uploading.

## Related Docs

- `apps/extension/.env.example`
- `apps/extension/.env.submit.example`
- `apps/extension/wxt.config.ts`
- `apps/docs/integrations/chrome-extension.mdx`
- `apps/docs/integrations/chrome-extension-side-panel.mdx`
- `apps/api/README.md`
- `apps/dash/README.md`
