# @userplane/metadata

## Purpose

`@userplane/metadata` stores custom metadata callbacks and static metadata for Userplane recordings. It is a standalone browser package for pages that need metadata support without importing the full SDK.

## Import Surface

- `@userplane/metadata`: `metadata`, `set`, `getCustomMetadata`, `clearMetadata`, `MetadataFunction`, `Serializable`, and `SerializableObject`.

## Consumers

Package-level consumers include `@userplane/embed` and `@userplane/sdk`.

## Quick Start

```ts
import { metadata, set } from '@userplane/metadata';

set('appVersion', '2.1.0');
set('environment', 'production');

metadata(() => ({
  userId: getCurrentUser().id,
  route: window.location.pathname,
}));
```

Read or clear metadata:

```ts
import { clearMetadata, getCustomMetadata } from '@userplane/metadata';

const current = getCustomMetadata();
clearMetadata('function');
clearMetadata('appVersion');
clearMetadata();
```

## Architecture

- `src/index.ts` owns the full metadata implementation.
- Metadata is stored at `window.__userplane__.exports`.
- `metadata(fn)` stores one lazy callback; calling it again replaces the previous callback.
- `set(key, value)` stores static metadata by key.
- `getCustomMetadata()` merges static metadata with callback results; callback values take priority.
- `clearMetadata()` clears all metadata, `function`, `static`, or a specific static key.

## Scripts

- `bun run dev`: Vite build watch.
- `bun run build`: compile with `tsc` and build with Vite.
- `bun run build:npm`: build NPM-optimized output.
- `bun run build:cdn`: build CDN-optimized output.
- `bun run typecheck`: run TypeScript without emitting output.
- `bun run lint`: run ESLint.
- `bun run clean`: remove generated caches, `dist`, and `node_modules`.
- `bun run preview`: Vite preview.
- `bun run prepublishOnly`: fail local publishing with a GitHub Actions reminder.

## Tests/Storybook

There is no package-local test or Storybook script. Use `typecheck`, `lint`, and consuming SDK/embed checks.

## Env/Secrets

No secrets are required. Development logging uses the build-time `__DEV__` constant where bundlers define it.

## Change Checklist

- Keep metadata values serializable.
- Preserve the shared `window.__userplane__.exports` namespace used by SDK and embed.
- Check merge and clear behavior when changing storage logic.
- Run `bun run --filter @userplane/metadata typecheck`, `lint`, and `build`.

## Troubleshooting

- If metadata is `null`, verify either `set()` or `metadata()` has been called in the same browser context.
- If static values are overwritten, check whether the metadata callback returns the same key.
- If server rendering fails, ensure calls that access metadata run in the browser.
- If SDK metadata behaves differently, check SDK re-exports before changing this package.
