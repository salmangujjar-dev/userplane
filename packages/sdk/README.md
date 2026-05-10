# @userplane/sdk

## Purpose

`@userplane/sdk` is the SSR-safe, manually initialized JavaScript SDK for the Userplane recorder. It manages recorder/capture/verification frames, URL parameter parsing, postbridge connections, tab identity, metadata registration, privacy blur, and log capture.

## Import Surface

- `@userplane/sdk`: `initialize`, `open`, `unmount`, `destroy`, state inspection helpers, tab reference helpers, metadata helpers, URL param constants, SDK option/state/context types, and metadata package re-exports.

The SDK has no side effects on import. Recording behavior starts when `initialize()` is called in a browser context.

## Consumers

Package-level consumers include `@userplane/embed`.

## Quick Start

```ts
import * as userplane from '@userplane/sdk';

userplane.initialize({
  workspaceId: 'ws_xxx',
  openImmediately: true,
});

userplane.metadata(() => ({
  userId: getCurrentUserId(),
  route: window.location.pathname,
}));
```

Client lifecycle example:

```tsx
'use client';

import * as userplane from '@userplane/sdk';
import { useEffect } from 'react';

export function UserplaneProvider() {
  useEffect(() => {
    userplane.initialize({ workspaceId: 'ws_xxx' });
    return () => userplane.destroy();
  }, []);

  return null;
}
```

## Architecture

- `src/sdk.ts` owns public SDK state, initialization, recorder lifecycle, metadata wrappers, and teardown.
- `src/frame/` creates and manages recorder, capture, and verification iframes.
- `src/bridge/` owns postbridge connections between host page and Userplane frames.
- `src/log-capture/` integrates `@userplane/logger` for console/network/action capture.
- `src/config/` contains frame configuration defaults/builders.
- `src/utils/` contains meta tag, tab reference, and URL helpers.
- `src/index.ts` is the public entrypoint and metadata re-export surface.

## Scripts

- `bun run dev`: Vite build watch.
- `bun run build`: compile with `tsc` and build with Vite.
- `bun run build:npm`: build NPM-optimized output.
- `bun run build:cdn`: build CDN-optimized output.
- `bun run build:npm:obfuscate`: build NPM output with obfuscation mode.
- `bun run build:cdn:obfuscate`: build CDN output with obfuscation mode.
- `bun run typecheck`: run TypeScript without emitting output.
- `bun run lint`: run ESLint.
- `bun run clean`: remove generated caches, `dist`, and `node_modules`.
- `bun run preview`: Vite preview.
- `bun run prepublishOnly`: fail local publishing with a GitHub Actions reminder.
- `bun run storybook`: Storybook on port `6008`.
- `bun run build-storybook`: build static Storybook.

## Tests/Storybook

There is no package-local test script. Storybook runs on port `6008`; use it for SDK behavior and UI integration checks.

## Env/Secrets

No secrets are read directly. Callers provide:

- `workspaceId`, or one or more `<meta name="userplane:workspace">` tags.
- Optional `recorderBaseUrl` and `verificationBaseUrl`.
- Optional endpoint exclusions for log capture.

Builds may define `__DEV__` and optimization/obfuscation modes through Vite config.

## Change Checklist

- Keep import-time SSR safety: do not access `window` at module top level without guards.
- Preserve `initialize()` as the start of browser side effects.
- Check `@userplane/embed` after changing public SDK exports.
- Verify bridge and frame teardown behavior when changing lifecycle code.
- Run `bun run --filter @userplane/sdk typecheck`, `lint`, and `build`.

## Troubleshooting

- If `window is not defined`, check for unguarded browser API access.
- If the recorder does not open from a link, verify `userplane-action`, `userplane-token`, workspace IDs, and `openImmediately`.
- If metadata is missing, confirm `metadata()` or `set()` ran before submission.
- If logs are missing, inspect capture preferences, excluded endpoints, and bridge connection state.
