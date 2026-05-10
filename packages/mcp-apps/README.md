# @userplane/mcp-apps

## Purpose

`@userplane/mcp-apps` builds the React widgets used by Userplane MCP tools. These widgets render recording detail views and focused recording resources, such as console logs, network logs, and user actions, inside MCP app surfaces.

## Import Surface

- `@userplane/mcp-apps/package.json`: package metadata only.

The package is primarily a build artifact package. It does not expose reusable runtime components through the package export map.

## Consumers

No sibling package currently depends on `@userplane/mcp-apps` at package level. The built HTML outputs are consumed by the MCP/App integration that serves registered app resources.

## Quick Start

Build all app widgets:

```bash
bun run --filter @userplane/mcp-apps build
```

Develop one widget in watch mode:

```bash
MCP_APP=show-recording bun run --filter @userplane/mcp-apps dev
```

Valid app names in the build script are `show-recording`, `show-rec-console`, `show-rec-network`, and `show-rec-actions`.

## Architecture

- `scripts/build-apps.ts` runs one Vite build per widget and writes each result under `dist/<app>/index.html`.
- `src/show-recording/` renders the main recording overview widget.
- `src/show-rec-console/`, `src/show-rec-network/`, and `src/show-rec-actions/` render focused resource widgets.
- `src/components/recording/` and `src/components/shared/` hold shared React UI.
- `src/utils/bootstrap-widget.tsx` connects widgets to `@modelcontextprotocol/ext-apps`, handles tool results, loads focused resources, and renders empty/error/loading states.
- `src/ui/` owns shared widget styles and theme synchronization.

## Scripts

- `bun run dev`: Vite watch build for `MCP_APP=show-recording`.
- `bun run build`: build all widgets through `scripts/build-apps.ts`.
- `bun run lint`: run ESLint with zero warnings.
- `bun run typecheck`: run TypeScript without emitting output.
- `bun run clean`: remove generated caches, `dist`, and `node_modules`.

## Tests/Storybook

There is no package-local test or Storybook script. Verify with `typecheck`, `lint`, and a build of the widgets touched.

## Env/Secrets

- `MCP_APP` selects the widget entry during `dev` or individual Vite builds.
- No secrets are required by the package build itself.
- Runtime data arrives through MCP app tool results and app-only resource fetches.

## Change Checklist

- Keep `scripts/build-apps.ts` in sync when adding or renaming a widget entry.
- Keep `index.html` and `main.tsx` paired for each widget directory.
- Verify tool result parsing in `src/utils/` when contract shapes change.
- Run `bun run --filter @userplane/mcp-apps typecheck`, `lint`, and `build`.

## Troubleshooting

- If a build omits a widget, check the `APPS` list in `scripts/build-apps.ts`.
- If `dev` shows the wrong widget, check `MCP_APP`.
- If a widget renders the debug fallback, inspect the tool result shape expected by `extract-json` and `bootstrap-widget`.
- If theme colors are wrong, check `setupThemeSync` and `src/ui/styles.css`.
