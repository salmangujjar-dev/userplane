# @userplane/contract

## Purpose

`@userplane/contract` is the type and validation source of truth for Userplane API boundaries. It defines oRPC contracts, Zod schemas, public API schemas/errors, constants, utility helpers, MCP tool definitions, and recorder bridge types.

## Import Surface

- `@userplane/contract`: domain contracts, contract types, schemas, constants, UI options, public API schemas/errors, error/token/URL utilities, and MCP tool definitions.
- `@userplane/contract/bridge`: serializable recorder bridge types, recording state/context types, metadata types, verification types, and log capture preference types.

## Consumers

Package-level consumers include `@userplane/auth`, `@userplane/cache`, `@userplane/client`, `@userplane/db`, `@userplane/email`, and `@userplane/sdk`.

## Quick Start

```ts
import { contract, recordingError, RecordingSchema } from '@userplane/contract';
import type { Contract } from '@userplane/contract';

type ApiContract = Contract;

const notFound = recordingError.notFound();
```

Bridge types:

```ts
import type { RecordingContext, RecordingState } from '@userplane/contract/bridge';

const state: RecordingState = 'inactive';
const context: RecordingContext | null = null;
```

## Architecture

- `src/contract/` contains oRPC contract trees by API domain.
- `src/schemas/` contains Zod schemas and domain error maps.
- `src/constants/` contains shared API constants for billing, headers, pagination, retention, session limits, sharing, links, and workspace settings.
- `src/public/` contains public API contract pieces.
- `src/mcp/` contains MCP tool definitions and related types.
- `src/bridge/` contains the recorder bridge type surface used by SDK/recorder code.
- `scripts/` contains OpenAPI and MCP submission/annotation generators.

## Scripts

- `bun run build`: compile with `tsc`.
- `bun run dev`: compile in watch mode.
- `bun run clean`: remove generated caches, `dist`, and `node_modules`.
- `bun run lint`: run ESLint with zero warnings.
- `bun run lint:fix`: apply ESLint fixes.
- `bun run typecheck`: run TypeScript without emitting output.
- `bun run generate:openapi`: generate OpenAPI output.
- `bun run check:mcp-tool-annotations`: validate MCP tool annotations.
- `bun run generate:chatgpt-app-submission`: generate MCP tool hint justifications.
- `bun run generate:mcp-tool-justifications`: alias for chatgpt app submission generation.

## Tests/Storybook

There is no package-local test or Storybook script. Use `typecheck`, `lint`, generation scripts, and consumer contract tests.

## Env/Secrets

No package runtime secrets are required. Generation scripts may depend on repository-local files and package source, but contract source does not load secrets.

## Change Checklist

- Update schemas, errors, and contracts together for endpoint shape changes.
- Check `@userplane/client` and server route implementations after contract changes.
- Regenerate OpenAPI or MCP artifacts when the changed surface feeds those outputs.
- Preserve `@userplane/contract/bridge` for SDK/recorder compatibility.
- Run `bun run --filter @userplane/contract typecheck`, `lint`, and relevant generation checks.

## Troubleshooting

- If client calls fail typechecking, inspect the contract input/output schema for that domain.
- If generated OpenAPI drifts, rerun `generate:openapi` after contract changes.
- If MCP submission checks fail, run `check:mcp-tool-annotations` and inspect tool metadata.
- If browser code imports too much contract code, use `@userplane/contract/bridge` where only bridge types are needed.
