# @userplane/postbridge

## Purpose

`@userplane/postbridge` provides Promise-based, type-friendly RPC across isolated JavaScript contexts such as iframes, workers, parent windows, and browser tabs. It replaces manual `postMessage` routing with host/guest connections and an optional SharedWorker-backed bridge for cross-tab communication.

## Import Surface

- `@userplane/postbridge`: `host`, `guest`, `withTransferable`, timeout/retry constants, and public connection/schema/message types.
- `@userplane/postbridge/bridge`: default `bridge` export for cross-tab broadcasting, direct tab messaging, connected-tab lookup, and compare-and-swap shared state.

Import bridge from its subpath:

```ts
import bridge from '@userplane/postbridge/bridge';
```

## Consumers

Package-level consumers include `@userplane/sdk`.

## Quick Start

Host/guest RPC:

```ts
import { guest, host } from '@userplane/postbridge';

const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

const hostConnection = await host.connect(worker, {
  getConfig: () => ({ theme: 'dark' }),
});

const result = await hostConnection.remote.processData([1, 2, 3]);
hostConnection.close();
```

In the worker:

```ts
import { guest } from '@userplane/postbridge';

const connection = await guest.connect({
  processData: (values: number[]) => values.map((value) => value * 2),
});

const config = await connection.remote.getConfig();
```

Cross-tab bridge:

```ts
import bridge from '@userplane/postbridge/bridge';

const connection = await bridge.connect({
  updateCount: (count: number) => {
    renderCount(count);
  },
});

await connection.remote.updateCount(42);
connection.close();
```

## Architecture

- `src/host.ts` connects from a parent/main context to a child context.
- `src/guest.ts` connects from a child context back to the parent/main context.
- `src/rpc.ts` registers local methods, remote proxies, request/resolve handling, and transferables.
- `src/helpers.ts` abstracts cross-platform target/event/message helpers.
- `src/types.ts` defines RPC, handshake, bridge, and connection types.
- `src/bridge.ts` implements the tab bridge client.
- `src/bridge-worker.ts` implements the SharedWorker relay and shared state behavior.
- `build:worker` bundles `bridge-worker.ts` to `src/bridge-worker.js` for the bridge subpath fallback.

## Scripts

- `bun run dev`: TypeScript watch mode.
- `bun run dev:storybook`: Storybook on port `6007`.
- `bun run build:worker`: bundle the bridge worker and copy it to `src/bridge-worker.js`.
- `bun run build`: remove `dist`, compile with `tsc`, and build the worker.
- `bun run typecheck`: run TypeScript without emitting output.
- `bun run lint`: run ESLint with zero warnings.
- `bun run lint:fix`: apply ESLint fixes.
- `bun run clean`: remove generated caches, `dist`, and `node_modules`.
- `bun run test`: run Vitest once.
- `bun run test:watch`: run Vitest in watch mode.
- `bun run storybook`: Storybook on port `6007`.
- `bun run build-storybook`: build static Storybook.

## Tests/Storybook

Vitest tests live under `tests/`. Storybook examples live under `stories/` and package examples live under `examples/`.

## Env/Secrets

No environment variables or secrets are required.

## Change Checklist

- Keep the root entrypoint free of bridge imports so consumers can avoid SharedWorker bundling.
- Use `@userplane/postbridge/bridge` for bridge docs and examples.
- Run `build:worker` when bridge worker code changes.
- Run `bun run --filter @userplane/postbridge test`, `typecheck`, and `lint`.
- Check examples when changing handshake, connection, or bridge behavior.

## Troubleshooting

- If bridge imports fail, confirm the consumer imports the subpath `@userplane/postbridge/bridge`.
- If cross-tab sync does not work, verify SharedWorker support and bridge worker bundling.
- If RPC calls hang, check handshake timeouts, target origin/options, and whether `close()` ran early.
- If transferable values are copied instead of moved, wrap them with `withTransferable`.
