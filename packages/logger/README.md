# @userplane/logger

## Purpose

`@userplane/logger` captures browser session context for Userplane recordings. It patches browser APIs, listens for console/network/navigation/action/resource/error events, processes them into structured entries, and dispatches them through caller-provided save callbacks.

This is the recording capture package. For simple console logging, use `@userplane/console-logger`; for Pino server logging, use `@userplane/common-logger`.

## Import Surface

- `@userplane/logger`: `LogProcessor`, `LogStore`, `initPatches`, dispatch strategies, event bridge helpers, constants, interceptor utilities, parsing/serialization utilities, and capture/log types.

## Consumers

Package-level consumers include `@userplane/contract` and `@userplane/sdk`.

## Quick Start

```ts
import { LogProcessor } from '@userplane/logger';

const processor = new LogProcessor(
  'tab_123',
  async (payload) => {
    await sendLogPayload(payload);
  },
  'ws_123',
  window.location.href,
  ['https://api.userplane.io'],
  {
    dispatchMode: 'batched',
    capture: { console: true, network: true, action: true },
  }
);

processor.start();
```

`initPatches()` is called by the processor path; use it directly only for low-level capture integration work.

## Architecture

- `src/patcher.ts` patches browser APIs and emits raw `__userplane_logger` events.
- `src/log-processor.ts` listens to raw events, normalizes them, filters internal endpoints, and dispatches entries.
- `src/dispatch-strategy.ts` implements immediate and batched dispatch.
- `src/event-bridge.ts` controls dispatch lifecycle and teardown.
- `src/interceptors/` contains focused patching logic for console, fetch, XHR, navigation, focus, CSP, resources, unload, and user clicks.
- `src/utils/` handles serialization, parsing, redaction/truncation support, URL helpers, headers, content type, performance, and throttling.

## Scripts

- `bun run dev`: TypeScript watch mode.
- `bun run build`: remove `dist` and compile with `tsc`.
- `bun run lint`: run ESLint with zero warnings.
- `bun run lint:fix`: apply ESLint fixes.
- `bun run typecheck`: run TypeScript without emitting output.
- `bun run clean`: remove generated caches, `dist`, and `node_modules`.
- `bun run test`: run Vitest once.
- `bun run test:watch`: run Vitest in watch mode.
- `bun run test:coverage`: run Vitest with coverage.
- `bun run storybook` / `bun run dev:storybook`: Storybook on port `6011`.
- `bun run build-storybook`: build static Storybook.

## Tests/Storybook

Unit tests live under `src/utils/*.test.ts`. Storybook is available for browser-facing capture scenarios on port `6011`.

## Env/Secrets

No secrets are read directly. Development logging uses the build-time `__DEV__` constant where bundlers define it. Save endpoints, workspace IDs, tab IDs, and internal endpoint lists come from the caller.

## Change Checklist

- Add tests for parser, serialization, truncation, header, content-type, or URL behavior changes.
- Verify patch/unpatch behavior when modifying interceptors.
- Check that internal Userplane endpoints are not captured as customer network logs.
- Run `bun run --filter @userplane/logger test`, `typecheck`, and `lint`.
- Use Storybook or an app integration when changes depend on real browser APIs.

## Troubleshooting

- If no logs are captured, check that `processor.start()` ran in a browser and dispatch has not been disabled.
- If duplicate logs appear, verify patch initialization is guarded by `window.__userplane_logger_loaded`.
- If fetch or XHR behavior breaks, inspect the corresponding interceptor and unpatch path.
- If payloads are too large, check truncation and batching settings before changing storage limits.
