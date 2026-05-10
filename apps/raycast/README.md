# Userplane for Raycast

## Purpose

`apps/raycast` is the Userplane Raycast extension. It lets users create recording links, browse recordings, browse recording links, and open dashboard views from Raycast commands and the macOS menu bar.

The package name is `userplane`, and the extension is configured for Raycast Store publishing.

## Where It Fits

The Raycast extension is intentionally standalone:

- It does not depend on private `@userplane/*` workspace packages, so `ray publish` can produce a valid Store submission.
- It uses a hand-written API client against the public API under `/api/v1/public/*`.
- It authenticates with a Userplane API key stored by Raycast preferences.
- It opens dashboard URLs for deep review and settings workflows.
- Its user-facing docs and screenshots are mirrored in `apps/docs/integrations/raycast*.mdx`.

## Stack

- Platform: Raycast extension runtime.
- UI/API: `@raycast/api` and `@raycast/utils`.
- Language: TypeScript and React components compiled by Raycast tooling.
- API client: hand-written fetch client in `src/api/client.ts`.
- Formatting/linting: Raycast ESLint config, Prettier, and TypeScript.
- Release metadata: `package.json`, `CHANGELOG.md`, `assets`, `metadata`, and committed `package-lock.json`.

## Local Development

From the repository root:

```bash
make raycast:dev
```

Or from this directory:

```bash
cd apps/raycast
bun run dev
```

Useful commands:

```bash
bun run build
bun run lint
bun run fix-lint
bun run typecheck
bun run publish
```

The Raycast dev command opens the extension in the local Raycast runtime with hot reload.

## Environment

Raycast extensions use preferences rather than `.env` files. Preferences are defined in `package.json` and typed in the generated `raycast-env.d.ts`.

Preferences:

- `apiKey` - required Userplane API key. Create one in the dashboard developer settings.
- `apiBaseUrl` - optional API host override. Defaults to `api.userplane.io`. Bare hosts and full `http(s)://` origins are accepted.
- `dashBaseUrl` - optional dashboard host override. Defaults to `dash.userplane.io`. Bare hosts and full `http(s)://` origins are accepted.

`src/utils/normalize-url.ts` normalizes preference input down to a clean origin. The API client appends `/api/v1`, and dashboard helpers append product paths.

## Key Workflows

- `create-link` - choose workspace, project, and domain; add optional reference; create a recording link through the public API; copy it to the clipboard; optionally open it in the browser.
- `list-recordings` - browse workspace recordings with filters and sorting, then open or copy dashboard playback URLs.
- `list-links` - browse recording links with filters and sorting, copy/open links, edit context from dashboard, or jump to recordings for a link.
- `menu-bar` - macOS menu bar entry with quick links to Raycast commands and dashboard pages.
- Shared actions - open dashboard, view recordings, change API key, and advanced options from common command action sections.
- Persistence - Raycast LocalStorage remembers last-used workspace/domain/project and filter preferences.

## Important Directories

- `src/api` - fetch client, error mapping, pagination helpers, and hand-written response types.
- `src/components` - shared command actions, filter picker, and link success view.
- `src/hooks` - cached resource hooks for workspaces, domains, projects, members, links, recordings, search, and debouncing.
- `src/utils` - dashboard URL helpers, formatting helpers, and host normalization.
- `src/*.tsx` - Raycast command entry files and filter forms.
- `assets` - extension icon assets.
- `metadata` - Raycast Store screenshots.
- `CHANGELOG.md` - release notes for Store submission.
- `CONTRIBUTING.md` - detailed local development and release guidance.
- `package-lock.json` - npm lockfile required for Raycast Store review.

## Checks

From this directory:

```bash
bun run lint
bun run typecheck
bun run build
```

From the root:

```bash
make raycast:lint
make raycast:typecheck
make raycast:build
```

## Deployment/Release

Before publishing:

1. Update `CHANGELOG.md`.
2. Confirm `metadata` screenshots are current.
3. Bump package metadata if needed.
4. Regenerate the Raycast Store lockfile:

```bash
make raycast:prepublish
```

Publish flow:

```bash
make raycast:publish
```

That target regenerates `apps/raycast/package-lock.json`, then runs `ray publish`, which opens the Raycast Store submission flow.

## Related Docs

- `apps/raycast/CONTRIBUTING.md`
- `apps/raycast/CHANGELOG.md`
- `apps/raycast/package.json`
- `apps/docs/integrations/raycast.mdx`
- `apps/docs/integrations/raycast-create-links.mdx`
- `apps/docs/integrations/raycast-recordings.mdx`
- `apps/docs/integrations/raycast-links.mdx`
- `apps/api/README.md`
