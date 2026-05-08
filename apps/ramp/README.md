# Ramp

## Getting Started

First, run the development server:

```bash
bun dev
```

Open [http://localhost:3002](http://localhost:3002) with your browser to see the result.

## Userplane SDK resolution

Ramp intentionally resolves `@userplane/sdk` differently by build mode:

- `bun run dev` sets `USERPLANE_SDK_SOURCE=workspace` and bundles `packages/sdk/src/index.ts` through Next.js aliases.
- `bun run build`, `bun run build:production`, and Netlify builds set `USERPLANE_SDK_SOURCE=npm` and use the pinned published SDK package from npm.

When publishing a new SDK for production Ramp, update the exact `@userplane/sdk` tarball URL in `package.json`.

## Database

Ramp uses Turso through the LibSQL Drizzle driver.

Required env vars:

```bash
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
```

Useful commands:

```bash
bun run db:migrate
bun run db:import-local
TURSO_ALLOW_SEED_RESET=1 bun run db:seed
```

`db:import-local` copies rows from `data/ramp.db` into Turso with `INSERT OR IGNORE`, so it will not overwrite existing remote rows. `db:seed` resets the demo data tables and requires `TURSO_ALLOW_SEED_RESET=1` when pointed at a remote database.

When deploying, set the same Turso env vars in the hosting provider.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
