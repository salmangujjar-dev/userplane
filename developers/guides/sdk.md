# Contributing to the SDK

Browser SDK for embedding session recording into web applications.

## Prerequisites

- [ ] Dependencies installed (`bun install` from monorepo root)

No external services are required. The SDK builds standalone.

## Architecture

The SDK is a TypeScript library bundled with Vite. It captures DOM mutations, user interactions, and console/network activity, then sends recording data to the Userplane API. The embed package provides a CDN-loadable script tag. The metadata package handles user identification.

```
packages/sdk/src/
├── sdk.ts            # Main SDK class and public API
├── bridge/           # Communication with recording iframe
├── frame/            # Recording frame logic
├── log-capture/      # Console log interception
├── config/           # SDK configuration
├── types/            # TypeScript type definitions
├── constants.ts      # SDK constants
├── logger.ts         # Internal logger
└── utils/            # Utility functions

packages/embed/src/
├── index.ts          # Barrel export
└── script.ts         # CDN embed script (async loader)

packages/metadata/src/
└── index.ts          # Metadata SDK for user identification
```

The SDK initializes a recording session, captures events via MutationObserver and event listeners, and streams data through the bridge to the API.

## Development Workflow

```bash
# Build SDK + run consuming apps for integration testing
make dev:sdk

# Build SDK only
make build:sdk

# Run the demo app (Ramp) for manual testing
make dev:ramp
```

The Ramp demo app runs on **http://localhost:3002** and loads the SDK for integration testing.

## Key Files

| File                             | Purpose                          |
| -------------------------------- | -------------------------------- |
| `packages/sdk/src/sdk.ts`        | SDK entry point and public API   |
| `packages/sdk/src/bridge/`       | Cross-frame communication        |
| `packages/sdk/src/frame/`        | Recording frame logic            |
| `packages/sdk/src/config/`       | Configuration and defaults       |
| `packages/embed/src/script.ts`   | CDN embed script                 |
| `packages/metadata/src/index.ts` | User identification API          |
| `packages/sdk/vite.config.ts`    | Build configuration              |
| `apps/ramp/`                     | Demo app for integration testing |

## Common Tasks

### Add a new SDK method

1. Define the method signature in `packages/sdk/src/types/`.
2. Implement the method in `packages/sdk/src/sdk.ts`.
3. Export from `packages/sdk/src/index.ts`.
4. Test with the Ramp demo app.

### Modify recording behavior

1. Locate the relevant capture logic in `packages/sdk/src/frame/` or `packages/sdk/src/log-capture/`.
2. Make changes and rebuild with `make build:sdk`.
3. Verify in the Ramp demo app.

### Update the CDN embed script

1. Edit `packages/embed/src/script.ts`.
2. Build with `make build:sdk`.
3. The embed script is the async loader that initializes the SDK from a `<script>` tag.

### Modify privacy/blur behavior

1. Edit the relevant files in `packages/blurr/src/`.
2. `BlurManager.ts` controls blur state, `observer.ts` watches for DOM changes, `selectors.ts` defines which elements to blur.
3. Run existing tests: `cd packages/blurr && bun test`.

## Testing

1. Build the SDK: `make build:sdk`.
2. Start the Ramp demo app: `make dev:ramp`.
3. Open **http://localhost:3002** in a browser.
4. Verify recording starts and events are captured in the browser DevTools Network tab.
5. Check the console for SDK initialization logs.

Build output lands in `packages/sdk/dist/` with ESM, CJS, and type declaration files.

**Note:** The SDK supports `OPTIMIZE_MODE` and `OBFUSCATE_MODE` environment variables to control terser minification and code obfuscation in production builds.
