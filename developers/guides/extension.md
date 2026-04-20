# Contributing to the Chrome Extension

Browser extension for quick access to recordings, links, and workspace management.

## Prerequisites

- [ ] Database configured ([Neon](../setup/neon.md) or [Supabase](../setup/supabase.md))
- [ ] Dependencies installed (`bun install` from monorepo root)
- [ ] API running (`make dev:api`) for backend data
- [ ] Google Chrome or Chromium-based browser

## Architecture

The extension is built with WXT (Chrome extension framework), React 19, TanStack Router, and Zustand for state management. It provides a side panel for browsing recordings and managing links, with background scripts for event handling.

```
apps/extension/src/
├── entrypoints/      # Extension entry points
│   ├── sidepanel/    # Side panel UI
│   ├── background/   # Background service worker
│   └── options/      # Extension options page
├── features/         # Feature modules
│   ├── recordings/   # Recording browsing
│   ├── links/        # Link management
│   ├── projects/     # Project management
│   ├── domains/      # Domain management
│   └── workspace/    # Workspace operations
├── components/       # Shared UI components
│   ├── auth/         # Authentication flow
│   ├── recordings/   # Recording components
│   ├── links/        # Link components
│   ├── create-link/  # Link creation
│   ├── edit-link/    # Link editing
│   ├── share-link/   # Link sharing
│   ├── filters/      # Filter components
│   ├── settings/     # Settings components
│   ├── layout/       # Layout components
│   └── shared/       # Shared primitives
├── stores/           # Zustand stores
│   ├── workspace.ts  # Workspace state
│   └── settings.ts   # Extension settings
├── hooks/            # Custom React hooks
├── client/           # API client configuration
├── lib/              # Utility functions
└── styles/           # Tailwind styles
```

The side panel is the primary UI surface. The background service worker handles extension lifecycle events and API communication. State persists through Zustand stores with Chrome storage.

## Development Workflow

```bash
# Start extension dev server
make dev:extension

# Build for production
make build:extension
```

Dev server runs on **http://localhost:3010** (for HMR), but the extension is loaded into Chrome directly.

## Key Files

| File                                         | Purpose                     |
| -------------------------------------------- | --------------------------- |
| `apps/extension/wxt.config.ts`               | WXT framework configuration |
| `apps/extension/src/entrypoints/sidepanel/`  | Side panel entry point      |
| `apps/extension/src/entrypoints/background/` | Background service worker   |
| `apps/extension/src/features/`               | Feature modules             |
| `apps/extension/src/stores/workspace.ts`     | Workspace state management  |
| `apps/extension/src/components/`             | UI components               |
| `apps/extension/src/client/`                 | API client setup            |

## Common Tasks

### Add a new extension page

1. Create a new entry point directory under `apps/extension/src/entrypoints/`.
2. Define the page in `apps/extension/wxt.config.ts`.
3. Add routing via TanStack Router.

### Modify the side panel UI

1. Edit components in `apps/extension/src/components/`.
2. Feature logic lives in `apps/extension/src/features/`.
3. Use Zustand stores for state that needs to persist across panel opens.

### Add a context menu action

1. Register the context menu in `apps/extension/src/entrypoints/background/`.
2. Handle the click event in the background service worker.
3. Communicate with the side panel via Chrome messaging APIs.

### Add a new feature module

1. Create a directory under `apps/extension/src/features/{feature}/`.
2. Add components under `apps/extension/src/components/{feature}/`.
3. Wire up data fetching through the API client in `apps/extension/src/client/`.

## Testing

1. Run `make dev:extension`.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode** (toggle in top-right).
4. Click **Load unpacked**.
5. Select `apps/extension/.output/chrome-mv3-dev`.
6. Open the extension side panel from the Chrome toolbar.
7. Verify authentication, recording browsing, and link management work.
8. Check the background service worker console via `chrome://extensions` > **Inspect views: service worker**.
9. For production testing, run `make build:extension` and load the built output.
