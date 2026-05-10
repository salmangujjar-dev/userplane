# @userplane/embed

## Purpose

`@userplane/embed` is the auto-initializing embed distribution for the Userplane recorder. It re-exports SDK controls, initializes automatically in the browser, exposes `window.userplane`, and includes CDN build/deploy scripts for the stable bootstrap script and content-hashed main bundle.

For NPM users who want manual initialization, prefer `@userplane/sdk`.

## Import Surface

- `@userplane/embed`: SDK control functions and types re-exported from `@userplane/sdk`, metadata serializable types, and browser auto-initialization side effects.

The CDN build also produces `script.js` as a bootstrap loader and `main.js` as the auto-initializing embed bundle.

## Consumers

No sibling package currently depends on `@userplane/embed` at package level. It is consumed by customer pages through the CDN script or by apps that intentionally want auto-initialization semantics.

## Quick Start

Script tag usage:

```html
<meta name="userplane:workspace" content="ws_xxx" />
<script type="module" src="https://cdn.userplane.io/embed/script.js"></script>
```

Manual control after the script loads:

```html
<script type="module">
  window.userplane?.metadata(() => ({
    userId: getCurrentUserId(),
  }));

  window.userplane?.open();
</script>
```

NPM import, with auto-initialization on import:

```ts
import { open, unmount } from '@userplane/embed';

open('recording-token');
unmount();
```

## Architecture

- `src/index.ts` re-exports SDK APIs, calls `initialize()` in browsers, and assigns `window.userplane`.
- `src/script.ts` is the tiny CDN bootstrap loader. It fetches `manifest.json`, loads the content-hashed main module, and preserves script nonce for CSP.
- `vite.config.ts` supports normal package builds and CDN builds selected by `OPTIMIZE_MODE=cdn` and `CDN_ENTRY`.
- `scripts/upload-cdn.ts` uploads CDN artifacts to R2 with short-cache bootstrap/manifest files and immutable content-hashed assets.
- `example/` contains a static demo of script-tag behavior.

## Scripts

- `bun run dev`: Vite build watch.
- `bun run build`: compile with `tsc` and build package bundles.
- `bun run build:cdn`: build CDN `script` and `main` entries.
- `bun run upload:cdn`: upload CDN assets.
- `bun run deploy:cdn`: build and upload CDN assets.
- `bun run typecheck`: run TypeScript without emitting output.
- `bun run lint`: run ESLint.
- `bun run clean`: remove generated caches, `dist`, and `node_modules`.
- `bun run preview`: Vite preview.
- `bun run storybook`: Storybook on port `6010`.
- `bun run build-storybook`: build static Storybook.

## Tests/Storybook

There is no package-local test script. Storybook runs on port `6010`; use it with the example app or local CDN build checks when changing browser behavior.

## Env/Secrets

CDN build/deploy uses:

- `CDN_DOMAIN`: CDN domain, defaulting to `https://cdn.userplane.io`.
- `R2_CDN_PREFIX`: CDN prefix path, defaulting to `embed`.
- `R2_CDN_ACCOUNT_ID`
- `R2_CDN_ACCESS_KEY_ID`
- `R2_CDN_SECRET_ACCESS_KEY`
- `R2_CDN_BUCKET_NAME`

The upload script can load `.env.<env>` from `packages/embed` or `apps/api`.

## Change Checklist

- Keep `@userplane/embed` auto-initialization semantics explicit in docs and tests.
- Check `@userplane/sdk` exports before re-export changes.
- Verify CDN `script.js` still loads `manifest.json` and the content-hashed main bundle.
- Run `bun run --filter @userplane/embed typecheck`, `lint`, and `build`.
- Run `build:cdn` before changing CDN upload behavior.

## Troubleshooting

- If `window.userplane` is undefined, check that the browser loaded the main embed module, not only the bootstrap script.
- If the recorder does not open from a URL, verify `userplane-action`, `userplane-token`, and workspace meta tags.
- If CDN deploy fails, verify R2 credentials and prefix/domain settings.
- If CSP blocks loading, check nonce preservation on the bootstrap script.
