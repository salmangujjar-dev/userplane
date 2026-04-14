# Userplane for Raycast

A Raycast extension for Userplane. Create recording links, browse your recordings and links, and open the Userplane dashboard from the macOS menu bar.

## Commands

- **Create Recording Link** — pick a workspace (auto-hidden when you only have one), project, and domain; optionally tag the link with a reference; submit copies the URL to the clipboard. `⌘↵` creates the link and opens it in the browser. Remembers the last workspace/domain/project you used.
- **Browse Links** — list recording links in the current workspace. `⌘F` opens a filter form (creators, projects, domains, sort by, direction). `⌘⇧F` clears filters. Filter state is cached per workspace. Per-item actions: Copy Link URL, Open Link, View Recordings for This Link (`⌘R`), Switch Workspace, View All in Dashboard.
- **Browse Recordings** — a thumbnail grid of workspace recordings with creator, duration, and relative-time subtitles. Recordings nearing expiry get a clock accessory. `⌘F` opens a filter form (creators, projects, links, sort by, direction). `⌘⇧F` resets filters. Filter state is cached per workspace. Per-item actions: Open in Dashboard, Copy Dashboard URL (`⌘C`), Switch Workspace, View All in Dashboard.
- **Userplane Menu Bar** — a tiny menu-bar launcher that fast-paths you into Create Recording Link, Browse Recordings, Browse Recording Links, and Open Dashboard, plus an Extension Preferences shortcut.

Every command also exposes a **Userplane** action section with Open Dashboard (`⌘D`), View My Recordings (`⌘⇧R`), Change API Key (`⌘⇧K`), and Advanced Options (`⌘⇧A`).

## Setup

1. Create an API key at [dash.userplane.io/\_/account?tab=developers](https://dash.userplane.io/_/account?tab=developers).
2. Open Raycast → search any Userplane command.
3. Paste the key into the **API Key** preference (stored in the macOS keychain).
4. For self-hosted or staging deployments, override **API Host** (`apiBaseUrl`, defaults to `api.userplane.io`) and **Dashboard Host** (`dashBaseUrl`, defaults to `dash.userplane.io`). Both accept a bare host or a full `https://` URL. Every "Open in Dashboard" action respects the dashboard override.

## Local development

```sh
cd apps/raycast
bun install
bun run dev
```

`bun run dev` runs `ray develop`, opening the extension in your local Raycast with hot reload. Before committing:

```sh
bun run typecheck
bun run lint
bun run build
```

Or from the repo root:

```sh
make raycast:typecheck
make raycast:lint
make raycast:build
```

## Publishing to the Raycast Store

```sh
cd apps/raycast
bun run lint
bun run build
bun run publish
```

The extension is intentionally self-contained — no `@userplane/*` workspace dependencies — so `ray publish` produces a valid Store submission without bundling any private packages. The API client and contract types live in `src/api/` and are hand-written mirrors of the corresponding schemas in `packages/contract/src/schemas/`.
