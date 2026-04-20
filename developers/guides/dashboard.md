# Contributing to the Dashboard

React UI for workspace management, recordings, integrations, and settings.

## Prerequisites

- [ ] Database configured ([Neon](../setup/neon.md) or [Supabase](../setup/supabase.md))
- [ ] Dependencies installed (`bun install` from monorepo root)
- [ ] API running (`make dev:api`) for backend data

## Architecture

The dashboard is a Next.js 15 App Router application using React 19. Data fetching uses TanStack Query through the type-safe oRPC client (`@userplane/client`). Forms use react-hook-form with Zod validation from shared contracts. UI primitives come from `@workspace/ui` (Radix UI + Tailwind CSS).

```
apps/dash/src/
├── app/              # Next.js App Router pages and layouts
│   ├── %5F/          # Authenticated workspace routes
│   ├── auth/         # Authentication pages
│   ├── invite/       # Invite acceptance flow
│   └── workspace/    # Workspace-scoped pages
├── components/       # Page-specific components
│   ├── recordings/   # Recording list, filters, player
│   ├── links/        # Link management
│   ├── domains/      # Domain configuration
│   ├── integrations/ # Third-party integrations
│   ├── settings/     # Workspace settings
│   └── navigation/   # Sidebar, header
├── features/         # Feature modules (domain logic + UI)
│   ├── recordings/   # Recording feature
│   ├── links/        # Link feature
│   ├── billing/      # Billing feature
│   └── ...
├── hooks/            # Custom React hooks
├── stores/           # Client-side state
├── schemas/          # Form validation schemas
└── client/           # API client configuration
```

Data flows from the API through TanStack Query hooks, into feature components that compose shared UI primitives.

## Development Workflow

```bash
# Start dashboard only (requires API running separately)
make dev:dash

# Start all apps together
make dev

# Run Storybook for component development
cd apps/dash && bun storybook
```

Dashboard runs on **http://localhost:3000**.

## Key Files

| File                              | Purpose                                           |
| --------------------------------- | ------------------------------------------------- |
| `apps/dash/src/app/layout.tsx`    | Root layout with providers                        |
| `apps/dash/src/app/%5F/`          | Authenticated workspace routes                    |
| `apps/dash/src/client/`           | oRPC client configuration                         |
| `apps/dash/src/hooks/index.ts`    | Hook barrel export                                |
| `apps/dash/src/features/`         | Feature modules                                   |
| `packages/ui/src/components/`     | Shared UI primitives (Button, Dialog, Card, etc.) |
| `packages/client/src/index.ts`    | Type-safe API client                              |
| `packages/contract/src/contract/` | API contract definitions                          |

## Common Tasks

### Add a new page

1. Create a route file under `apps/dash/src/app/` following Next.js App Router conventions.
2. Add page-specific components under `apps/dash/src/components/`.
3. Use the existing layout and navigation structure.

### Make an API call

Use the oRPC client from `@userplane/client`. All available operations are typed from the shared contract.

```ts
import { client } from '@/client';

const recordings = await client.recording.list.query({
  workspaceId,
});
```

### Add a form

1. Define the form schema in `apps/dash/src/schemas/` using Zod (or reuse a contract schema).
2. Use `react-hook-form` with `@hookform/resolvers/zod`.
3. Use `@workspace/ui` form primitives (`Input`, `Field`, `Button`).

### Add a shared UI component

Add the component to `packages/ui/src/components/`. Use Radix UI for behavior and Tailwind CSS for styling. Export from the package barrel.

## Testing

1. Open **http://localhost:3000** in a browser.
2. Verify changes render correctly.
3. Check the browser console for errors.
4. Test responsive views at mobile, tablet, and desktop breakpoints.
5. Verify API calls succeed in the Network tab.
