# Contributing to the Raycast Extension

Raycast extension for quick access to Userplane workspaces, projects, and recordings.

## Prerequisites

- [ ] [Raycast](https://raycast.com) installed
- [ ] API key configured (see [Unkey](../setup/unkey.md))

## Architecture

```
apps/raycast/
  src/                           # Commands and components
  package.json                   # Raycast manifest (commands, preferences)
```

**Key packages:**

- `@raycast/api` — Raycast extension API
- `@raycast/utils` — Raycast utilities

The extension calls the Userplane public API using an API key. Authentication is handled via user preferences (configured in Raycast settings), not environment variables.

## Development Workflow

```sh
cd apps/raycast
ray dev
```

This loads the extension in Raycast's development mode. Changes hot-reload automatically.

## Key Files

| File                        | Purpose                                  |
| --------------------------- | ---------------------------------------- |
| `apps/raycast/src/`         | Extension commands                       |
| `apps/raycast/package.json` | Command definitions and user preferences |

## Common Tasks

### Adding a new command

1. Create a new file in `apps/raycast/src/`
2. Register it in `package.json` under the `commands` array
3. Implement using `@raycast/api` components (List, Detail, Form, etc.)

### Adding a preference

1. Add to the `preferences` array in `package.json`
2. Access via `getPreferenceValues()` in your command

## Testing

1. Run `ray dev` to load the extension in Raycast
2. Open Raycast and search for your command
3. Verify data loads from the API
4. Test with different API keys and base URLs
