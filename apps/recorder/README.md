# Recorder

## Purpose

`apps/recorder` is the Next.js app that powers Userplane recording and verification flows. It presents the user-facing recording UI, verifies installation/domain context, hosts the hidden capture iframe used by the SDK, coordinates cross-tab metadata/log capture, and uploads recording resources through the API.

The package name is `recorder`.

## Where It Fits

The recorder is opened from recording links created in the dashboard, Chrome extension, Raycast extension, public API, or integrations. It talks to `apps/api` through the typed Userplane client and is embedded or coordinated by the SDK and postbridge packages.

Primary consumers and dependencies:

- `apps/api` - session initialization, upload initialization, upload completion, and domain verification.
- `packages/sdk` - opens recorder and capture/verification frames.
- `packages/postbridge` - bridge worker and frame communication.
- `packages/client` and `packages/contract` - typed API client and route contracts.
- `packages/ui`, `packages/storage`, `packages/shared`, and logger packages - shared UI, media, env, and logging behavior.

## Stack

- Framework: Next.js `16` App Router.
- UI: React `19`, Tailwind CSS `4`, `@userplane/ui`, Lucide icons, and Storybook.
- Browser APIs: `MediaRecorder`, `navigator.mediaDevices.getDisplayMedia`, IndexedDB-backed log capture, iframe communication, and cross-tab coordination.
- API client: `@userplane/client` with `NEXT_PUBLIC_API_URL`.
- Bridge: `@userplane/postbridge`, with `prepare:worker` building `public/bridge-worker.js`.
- Analytics/error tooling: PostHog browser package and optional source map upload through `@posthog/nextjs-config`.

## Local Development

From the repository root:

```bash
make dev:recorder
```

Or from this directory:

```bash
cd apps/recorder
bun run dev
```

The app runs on `http://localhost:4322`.

The dev script runs `prepare:worker` before `next dev`. If bridge behavior changes, rebuild the worker explicitly:

```bash
bun run prepare:worker
```

Useful commands:

```bash
bun run build
bun run start
bun run lint
bun run typecheck
bun run storybook
bun run build-storybook
```

## Environment

Start from `apps/recorder/.env.example`. Runtime env is parsed through `src/env/schema.ts` and transformed in `src/env/index.ts`.

Important values:

- `APP_ENV` - chooses `.env.development` or `.env.production` in `next.config.mjs`.
- `NEXT_PUBLIC_API_URL` - API base URL used by the recorder client. It must include the `/api/v1` path, for example `https://api-dev.userplane.io/api/v1`.
- `NEXT_PUBLIC_CDN_DOMAIN` - CDN domain for media assets.
- `NEXT_PUBLIC_ASSETS_DOMAIN` - assets domain for uploaded/generated content.
- `NEXT_PUBLIC_CLOUDFLARE_IMAGE_ZONE` - Cloudflare image transform zone.
- `NEXT_PUBLIC_SKIP_IMAGE_TRANSFORM` - set to `true` to serve original image URLs.
- `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` - optional client analytics/error tracking.
- `POSTHOG_PERSONAL_API_KEY` and `POSTHOG_PROJECT_ID` - build-time source map upload only.

## Key Workflows

- `/r` - recording flow. Reads `userplane-token`, `userplane-action=recording`, optional `userplane-workspace`, and optional `userplane-meta` query params.
- `/verify` - verification flow. Reads `userplane-token` and workspace query params, then coordinates verification through the parent SDK bridge.
- `/capture` - hidden capture iframe used by the SDK for metadata extraction, blur state sync, and log capture coordination.
- `/` - intentionally returns not found.
- `/api/v1/health` - local Next.js health route returning JSON status.

Recording flow:

1. Read recorder query params.
2. Initialize a session through the API using the link token.
3. Decode session preferences from the returned session token.
4. Capture screen and optional microphone/system audio.
5. Request metadata and logs from capture iframes.
6. Generate thumbnail and upload state.
7. Initialize upload with the API, upload resources to presigned URLs, then complete the upload with the API.

## Important Directories

- `src/app` - Next.js route groups for main recorder routes, bare capture route, root layout, not-found, and health route.
- `src/components/recording` - recording flow screens, video preview, upload/review UI, settings, and stories.
- `src/components/verification` - verification screens, states, and stories.
- `src/components/capture` - hidden capture iframe app.
- `src/hooks` - recording and verification state machines plus elapsed time and bridge sync hooks.
- `src/services` - media capture and recording session upload logic.
- `src/bridge` - postbridge connections, cross-tab coordination, constants, and types.
- `src/client` - recorder API client setup.
- `src/env` - env defaults, schema, and parser.
- `src/constants` - URL params, upload limits, copy, UI, and recording constants.
- `src/utils` - URL parsing, JWT decoding, retry, upload helpers, browser metadata, thumbnails, color, and time formatting.
- `public/bridge-worker.js` - generated bridge worker output.

## Checks

From this directory:

```bash
bun run lint
bun run typecheck
bun run build
```

For component work:

```bash
bun run storybook
bun run build-storybook
```

## Deployment/Release

Production commands:

```bash
bun run build
bun run start
```

The root Make target is:

```bash
make prod:recorder
```

The production target sets `APP_ENV=production`, loads `.env.production`, builds the recorder, and starts the Next.js server on port `4322`. `prebuild` runs `prepare:worker`, so the bridge worker is rebuilt as part of production builds.

## Related Docs

- `apps/recorder/.env.example`
- `apps/recorder/src/env/schema.ts`
- `apps/recorder/src/app`
- `apps/api/README.md`
- `apps/docs/recording/requesting.mdx`
- `apps/docs/developer/sdk-overview.mdx`
- `packages/sdk`
- `packages/postbridge`
