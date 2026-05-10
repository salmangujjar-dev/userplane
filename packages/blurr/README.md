# @userplane/blurr

## Purpose

`@userplane/blurr` provides the browser privacy blur layer used during recording and session replay. It finds sensitive elements, applies blur filters, tracks original element state, and observes DOM changes so dynamically inserted content can be blurred or restored.

## Import Surface

- `@userplane/blurr`: source entrypoint exporting `BlurManager`, `VERSION`, constants, selector helpers, blur calculators, state helpers, observer utilities, general utilities, and public types.

The package currently exports source TypeScript from `src/index.ts` for workspace consumers.

## Consumers

- `@userplane/sdk` consumes this package for recorder-side privacy controls.

## Quick Start

```ts
import { BlurManager } from '@userplane/blurr';

const manager = new BlurManager(['.customer-email', '[data-private]'], {
  minBlurRadius: 4,
  maxBlurRadius: 24,
});

manager.start();

// Later, when recording stops:
manager.stop();
```

## Architecture

- `src/BlurManager.ts` owns lifecycle, observers, manual blur/unblur, events, and metrics.
- `src/selectors.ts` builds default mask/unmask selector sets and reads custom selectors from metadata.
- `src/calculator.ts` calculates blur strength from text and media dimensions.
- `src/state.ts` stores and restores original element filter state.
- `src/observer.ts` batches DOM mutation and intersection observer work.
- `src/utils.ts` contains browser support checks, selector safety, throttling helpers, and logging setup.
- `stories/` and `.storybook/` document and exercise browser behavior.

## Scripts

- `bun run dev`: TypeScript watch mode.
- `bun run dev:storybook`: Storybook on port `6009`.
- `bun run build`: remove `dist` and compile with `tsc`.
- `bun run test`: run Vitest.
- `bun run test:coverage`: run Vitest with coverage.
- `bun run typecheck`: run TypeScript without emitting output.
- `bun run lint`: run ESLint with zero warnings.
- `bun run lint:fix`: apply ESLint fixes.
- `bun run clean`: remove generated caches, `dist`, and `node_modules`.
- `bun run storybook`: Storybook on port `6009`.
- `bun run build-storybook`: build static Storybook.

## Tests/Storybook

Vitest files live beside implementation files in `src/*.test.ts`. Storybook is available for interactive browser checks on port `6009`.

## Env/Secrets

No secrets are required. Runtime logging is delegated to `@userplane/console-logger` through the logger option or package defaults.

## Change Checklist

- Add or update tests for selector, calculator, observer, or state changes.
- Check that `stop()` restores original filters for elements changed by `start()` or `blurElement()`.
- Keep custom selector behavior aligned with `CUSTOM_SELECTOR_META_NAME`.
- Run `bun run --filter @userplane/blurr test`, `typecheck`, and `lint`.
- Use Storybook when behavior depends on browser rendering or DOM mutation timing.

## Troubleshooting

- If construction throws, check browser support for DOM APIs used by MutationObserver or IntersectionObserver.
- If elements remain blurred after teardown, inspect state helpers in `src/state.ts`.
- If custom selectors do nothing, verify the selector string is valid and not covered by an unmask selector.
- If dynamic content is missed, check mutation batching and whether the element is visible or in viewport.
