# Contributing to the Recorder

Session playback interface for viewing and analyzing recordings.

## Prerequisites

- [ ] Database configured ([Neon](../setup/neon.md) or [Supabase](../setup/supabase.md))
- [ ] Dependencies installed (`bun install` from monorepo root)
- [ ] API running (`make dev:api`) for recording data

## Architecture

The recorder is a Next.js 15 application that plays back recorded sessions. It renders captured DOM snapshots, replays user interactions, and provides playback controls. Cross-frame communication uses the postbridge package. Privacy masking uses the blurr package.

```
apps/recorder/src/
├── app/              # Next.js App Router pages
├── components/       # Playback components
│   ├── recording/    # Recording playback UI
│   ├── capture/      # Capture-related components
│   └── verification/ # Verification flow
├── bridge/           # PostBridge integration
├── client/           # API client configuration
├── contexts/         # React contexts
├── hooks/            # Custom React hooks
├── services/         # Client-side services
├── styles/           # Global styles
├── types/            # TypeScript types
└── utils/            # Utility functions

packages/postbridge/src/
├── host.ts           # Host-side bridge (parent frame)
├── guest.ts          # Guest-side bridge (recording frame)
├── rpc.ts            # RPC layer
├── bridge.ts         # Core bridge logic
└── types.ts          # Message types

packages/blurr/src/
├── BlurManager.ts    # Blur state management
├── observer.ts       # DOM mutation observer for blur
├── selectors.ts      # Element selectors for privacy
├── calculator.ts     # Blur region calculation
├── state.ts          # Blur state tracking
└── types.ts          # Type definitions
```

The recorder loads session data from the API, reconstructs the DOM in an iframe, and replays events on a timeline. PostBridge handles messaging between the host page and the recording iframe.

## Development Workflow

```bash
# Start recorder (also start the API in a separate terminal)
make dev:api
make dev:recorder

# Run Storybook for component development
cd apps/recorder && bun storybook
```

Recorder runs on **http://localhost:4322**.

## Key Files

| File                                      | Purpose                           |
| ----------------------------------------- | --------------------------------- |
| `apps/recorder/src/app/`                  | Next.js pages and layouts         |
| `apps/recorder/src/components/recording/` | Playback UI components            |
| `apps/recorder/src/bridge/`               | PostBridge integration            |
| `apps/recorder/src/hooks/`                | Playback hooks                    |
| `apps/recorder/src/contexts/`             | React contexts for playback state |
| `packages/postbridge/src/host.ts`         | Host-side bridge API              |
| `packages/postbridge/src/guest.ts`        | Guest-side bridge API             |
| `packages/blurr/src/BlurManager.ts`       | Privacy blur management           |

## Common Tasks

### Modify playback UI

1. Edit components in `apps/recorder/src/components/recording/`.
2. Playback state is managed through React contexts in `apps/recorder/src/contexts/`.
3. Use Storybook for isolated component development.

### Add recording controls

1. Add the control component under `apps/recorder/src/components/recording/`.
2. Wire it to the playback context for state (play/pause, seek, speed).
3. Use hooks from `apps/recorder/src/hooks/` for shared playback logic.

### Update privacy features

1. Modify selectors in `packages/blurr/src/selectors.ts` to change which elements are masked.
2. Update `packages/blurr/src/BlurManager.ts` for blur behavior changes.
3. Run tests: `cd packages/blurr && bun test`.

### Modify cross-frame messaging

1. Define message types in `packages/postbridge/src/types.ts`.
2. Implement host-side handling in `packages/postbridge/src/host.ts`.
3. Implement guest-side handling in `packages/postbridge/src/guest.ts`.
4. Use the RPC layer in `packages/postbridge/src/rpc.ts` for request/response patterns.

## Testing

1. Start the API: `make dev:api`.
2. Open **http://localhost:4322** with a valid recording ID (e.g., from the dashboard).
3. Verify playback starts and the timeline renders.
4. Test playback controls: play, pause, seek, speed adjustment.
5. Verify privacy blurring applies to masked elements.
6. Check the browser console for errors.
