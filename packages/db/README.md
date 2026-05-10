# @userplane/db

## Purpose

`@userplane/db` owns the Drizzle/PostgreSQL schema, generated migrations, database client factory, schema type exports, database constants, and selected Drizzle operator re-exports for Userplane data access.

## Import Surface

- `@userplane/db`: `createDb`, `getDb`, `DbClient`, `DbConfig`, schema exports, constants, and selected `drizzle-orm` operators such as `eq`, `and`, `sql`, `count`, and ordering/comparison helpers.
- `@userplane/db/schema`: table definitions, relations, enums, and inferred model types.
- `@userplane/db/client`: database client factory and client/config types.

## Consumers

Package-level consumers include `@userplane/auth`.

## Quick Start

```ts
import { getDb, workspaces, eq } from '@userplane/db';

const db = getDb({
  databaseUrl: process.env.DATABASE_URL!,
  maxConnections: 10,
});

const rows = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId));
```

## Architecture

- `src/client.ts` creates a `pg` pool and Drizzle client. It strips `sslrootcert=system` for providers that append that value.
- `src/schema/` contains table definitions, relations, enums, and inferred insert/select types.
- `src/constants.ts` contains DB-adjacent shared constants.
- `src/migrate.ts` and `src/reset.ts` run database workflows.
- `drizzle/` contains generated SQL migrations and Drizzle snapshot metadata.
- `drizzle.config.ts` points Drizzle Kit at `src/schema/index.ts` and `drizzle/`.

## Scripts

- `bun run build`: compile with `tsc`.
- `bun run dev`: compile in watch mode.
- `bun run db:generate`: generate Drizzle migrations from schema changes.
- `bun run db:migrate`: run migrations through `src/migrate.ts`.
- `bun run db:reset`: run reset workflow through `src/reset.ts`.
- `bun run db:push`: push schema directly with Drizzle Kit.
- `bun run db:studio`: open Drizzle Studio.
- `bun run lint`: run ESLint with zero warnings.
- `bun run lint:fix`: apply ESLint fixes.
- `bun run typecheck`: run TypeScript without emitting output.

## Tests/Storybook

There is no package-local test or Storybook script. Verify with `typecheck`, `lint`, migration generation/review, and local migration execution.

## Env/Secrets

- `DATABASE_URL` is required by Drizzle Kit workflows and migration scripts.
- Runtime database clients receive `databaseUrl` through `DbConfig`.

## Change Checklist

- Edit schema in `src/schema/` first.
- Use `db:push` only for local iteration.
- Run `db:generate` once the schema is stable.
- Review generated SQL in `drizzle/` for destructive changes.
- Run `db:migrate` locally before merging.
- Commit schema changes, generated SQL, and Drizzle snapshot metadata together.

## Troubleshooting

- If `sslrootcert=system` causes file errors, verify the URL passes through `createDb` or the sanitized Drizzle config.
- If migrations drift, do not hand-edit already-applied migrations; generate a new migration.
- If Drizzle Studio cannot connect, check `DATABASE_URL`.
- If a type is missing from the root import, confirm it is exported by `src/schema/index.ts`.
