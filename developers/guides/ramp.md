# Contributing to the Demo App

Self-contained demo application that showcases Userplane's SDK in a realistic product environment.

## Prerequisites

- [ ] Base setup complete (see [Quick Start](../../CONTRIBUTING.md))

No external services required. Ramp uses its own local SQLite database.

## Architecture

```
apps/ramp/
  src/
    app/                         # Next.js App Router pages
    components/                  # UI components
    lib/
      db/
        schema.ts                # SQLite schema (Drizzle)
        seed.ts                  # Demo data seeding
        migrate.ts               # Migration runner
  data/
    ramp.db                      # SQLite database file
```

**Stack:** Next.js, React 19, Tailwind CSS, Better Auth (local auth), SQLite via Drizzle ORM, Recharts

The Ramp app embeds the Userplane SDK (`@userplane/sdk`) to record user sessions. It also integrates Intercom and Zendesk widgets for demonstrating helpdesk use cases.

## Development Workflow

```sh
# First-time setup
make ramp:db:migrate
make ramp:db:seed

# Start development
make dev:ramp               # Port 3002
```

### Database Commands

| Command                 | Purpose                                     |
| ----------------------- | ------------------------------------------- |
| `make ramp:db:generate` | Generate new migrations from schema changes |
| `make ramp:db:migrate`  | Run pending migrations                      |
| `make ramp:db:seed`     | Populate with demo data                     |
| `make ramp:db:reset`    | Drop all tables and re-seed                 |

## Key Files

| File                             | Purpose         |
| -------------------------------- | --------------- |
| `apps/ramp/src/app/`             | Next.js pages   |
| `apps/ramp/src/components/`      | UI components   |
| `apps/ramp/src/lib/db/schema.ts` | Database schema |
| `apps/ramp/src/lib/db/seed.ts`   | Demo data       |

## Common Tasks

### Adding a new demo scenario

1. Add seed data in `apps/ramp/src/lib/db/seed.ts`
2. Create or modify pages in `apps/ramp/src/app/`
3. Run `make ramp:db:reset` to re-seed with new data

### Modifying the database schema

1. Edit `apps/ramp/src/lib/db/schema.ts`
2. Run `make ramp:db:generate` to create a migration
3. Run `make ramp:db:migrate` to apply it

### Adding Userplane SDK tracking

1. The SDK is already initialized in the app
2. Use `@userplane/sdk` methods to track custom events or identify users

## Testing

1. Open http://localhost:3002
2. Sign in with demo credentials (seeded by `make ramp:db:seed`)
3. Navigate through the app — verify the Userplane SDK records sessions
4. Check the Userplane dashboard to confirm recordings appear

## Environment Variables

Optional — only needed for Intercom/Zendesk widget integration:

```
NEXT_PUBLIC_INTERCOM_APP_ID=
INTERCOM_API_SECRET=
NEXT_PUBLIC_ZENDESK_KEY=
ZENDESK_MESSAGING_SIGNING_KEY=
ZENDESK_MESSAGING_SIGNING_KEY_ID=
```
