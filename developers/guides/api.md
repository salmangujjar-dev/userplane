# Contributing to the API

Hono HTTP server handling auth, storage, integrations, and business logic.

## Prerequisites

- [ ] Database configured ([Neon](../setup/neon.md) or [Supabase](../setup/supabase.md))
- [ ] [Cloudflare Tunnels](../setup/cloudflare-tunnels.md) configured (for webhook/integration testing)
- [ ] Dependencies installed (`bun install` from monorepo root)
- [ ] [Inngest](../setup/inngest.md) dev server running (for background jobs)

## Architecture

The API is a Hono application using oRPC for type-safe route definitions. Contracts in `packages/contract/` define request/response schemas with Zod. Routes delegate to services, which contain business logic and interact with the database via Drizzle ORM.

```
apps/api/src/
├── routes/           # Route handlers grouped by domain
│   ├── recording/    # Recording CRUD
│   ├── project/      # Project management
│   ├── workspace/    # Workspace operations
│   ├── link/         # Link management
│   ├── domain/       # Custom domains
│   ├── billing/      # Billing endpoints
│   ├── session/      # Session recording ingestion
│   ├── public-api/   # Public API (API key-authenticated)
│   └── api.router.ts # Root router
├── services/         # Business logic layer
├── clients/          # Third-party API clients (storage, email, etc.)
├── inngest/          # Background job definitions
│   └── functions/    # Individual Inngest functions
├── middleware/        # Auth, rate limiting, validation
├── repositories/     # Data access layer
├── env/              # Environment variable schema and parsing
└── index.ts          # Server entry point

packages/contract/src/
├── contract/         # Per-domain contract files
│   ├── recording.ts
│   ├── project.ts
│   ├── workspace.ts
│   └── ...
├── schemas/          # Shared Zod schemas
└── index.ts          # Barrel export

packages/db/
├── src/schema/       # Drizzle table definitions
├── drizzle/          # Generated migrations
└── drizzle.config.ts # Drizzle config
```

Request flow: Client -> Middleware -> Route Handler -> Service -> Repository/Client -> Database/External API.

## Development Workflow

```bash
# Start API server
make dev:api

# Start all apps together
make dev

# Database operations
make db:generate   # Generate migration from schema changes
make db:migrate    # Apply pending migrations
make db:studio     # Open Drizzle Studio (database GUI)
```

API runs on **http://localhost:3001**.

## Key Files

| File                                | Purpose                                |
| ----------------------------------- | -------------------------------------- |
| `apps/api/src/routes/api.router.ts` | Root router composing all route groups |
| `apps/api/src/env/schema.ts`        | Environment variable schema            |
| `apps/api/src/middleware/`          | Auth, rate limiting, CORS middleware   |
| `apps/api/src/clients/db.ts`        | Database client initialization         |
| `apps/api/src/inngest/functions/`   | Background job definitions             |
| `packages/contract/src/contract/`   | API contract definitions               |
| `packages/db/src/schema/`           | Database table definitions             |

## Common Tasks

### Add a new endpoint

1. Define the contract in `packages/contract/src/contract/{domain}.ts` with Zod input/output schemas.
2. Export from `packages/contract/src/contract/index.ts`.
3. Create or extend a route handler in `apps/api/src/routes/{domain}/`.
4. Implement business logic in `apps/api/src/services/{domain}.service.ts`.
5. Register the route in `apps/api/src/routes/api.router.ts` if it is a new route group.
6. Regenerate the OpenAPI spec: `make generate:openapi`.

### Add a database table

1. Create a schema file in `packages/db/src/schema/{table}.ts`.
2. Define the table using Drizzle's `pgTable`.
3. Export from `packages/db/src/schema/index.ts`.
4. Add relations in `packages/db/src/schema/relations.ts` if needed.
5. Generate the migration: `make db:generate`.
6. Apply the migration: `make db:migrate`.

### Add a background job

1. Create a function in `apps/api/src/inngest/functions/`.
2. Define the event type and handler using the Inngest client.
3. Register the function in `apps/api/src/inngest/functions/index.ts`.
4. Trigger the function from a service using the Inngest client's `send()`.

### Add environment variables

1. Add the variable to the schema in `apps/api/src/env/schema.ts`.
2. Add a default in `apps/api/src/env/defaults.ts` if applicable.
3. Update `.env.example` in the monorepo root.

## Testing

1. Use `curl`, Postman, or any HTTP client against **http://localhost:3001**.
2. Check terminal logs for request/response details.
3. Use Drizzle Studio (`make db:studio`) to inspect database state.
4. For background jobs, check the Inngest dev server UI at **http://localhost:8288**.
