# Contributing to MCP Apps

Model Context Protocol integrations that surface Userplane data inside AI assistants.

## Prerequisites

- [ ] Base setup complete (see [Quick Start](../../CONTRIBUTING.md))
- [ ] PostgreSQL configured (see [Neon](../setup/neon.md) or [Supabase](../setup/supabase.md))
- [ ] API server running (`make dev:api`)

## Architecture

```
apps/mcp/                        # MCP server configuration
packages/mcp-apps/               # MCP UI apps (React)
  src/apps/
    show-recording/              # Base recording viewer
    show-rec-actions/            # User actions timeline
    show-rec-console/            # Console logs viewer
    show-rec-network/            # Network requests viewer
```

Each MCP app is a focused React component that renders specific recording data inside an AI tool's UI. The API exposes MCP endpoints that AI assistants call to fetch data.

**Key packages:**

- `@modelcontextprotocol/sdk` — MCP protocol implementation
- `@modelcontextprotocol/ext-apps` — MCP app extensions
- React 19 + Tailwind CSS for UI rendering

## Development Workflow

```sh
make dev:api    # API must be running (serves MCP endpoints)
```

MCP apps are built with Vite and rendered by the AI client (Claude Code, ChatGPT, etc.).

## Key Files

| File                                           | Purpose                   |
| ---------------------------------------------- | ------------------------- |
| `packages/mcp-apps/src/apps/show-recording/`   | Base recording viewer app |
| `packages/mcp-apps/src/apps/show-rec-actions/` | User actions timeline     |
| `packages/mcp-apps/src/apps/show-rec-console/` | Console logs viewer       |
| `packages/mcp-apps/src/apps/show-rec-network/` | Network requests viewer   |
| `apps/api/src/routes/`                         | MCP-related API routes    |

## Common Tasks

### Adding a new MCP app

1. Create a new directory under `packages/mcp-apps/src/apps/`
2. Build a focused React component for the data you want to display
3. Register the app in the MCP server configuration
4. Each app gets its own directory — import shared components from `show-recording` if needed, but don't import across other apps

### Modifying an existing app

1. Find the app in `packages/mcp-apps/src/apps/`
2. Edit the React component
3. Test via an MCP client

## Testing

1. Use Claude Code or another MCP-compatible client
2. Invoke the relevant MCP tool
3. Verify the rendered output displays correctly
4. Check that data loads from the API without errors
