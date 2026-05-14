# Contributing to Userplane

## Prerequisites

- **Bun** 1.3.13 (`curl -fsSL https://bun.sh/install | bash`)
- **Node.js** >= 24 and < 25
- **cloudflared** (`brew install cloudflared` on macOS)
- A managed PostgreSQL database ([Neon](developers/setup/neon.md) or [Supabase](developers/setup/supabase.md))

## Quick Start

```sh
git clone https://github.com/wizenheimer/userplane.git
cd userplane
make install
make env:setup
# Edit apps/api/.env.development and set DATABASE_URL to your managed Postgres
make db:push
make dev
```

## Documentation Map

- [README.md](README.md) is the flagship product and monorepo overview.
- [apps/README.md](apps/README.md) maps every runnable app, local port, command, environment surface, and owner guide.
- [packages/README.md](packages/README.md) maps every shared package, import surface, consumer set, and change checklist.
- [developers/README.md](developers/README.md) contains deeper setup guides and area-specific contributor guides.
- [assets/readme/README.md](assets/readme/README.md) tracks the media used by the root README.

## Cloudflare Tunnels

Several features require HTTPS URLs (OAuth callbacks, webhooks, integrations). Use ephemeral Cloudflare tunnels to expose local ports.

Run `cloudflared tunnel --url http://localhost:PORT` in a separate terminal for each app that needs an HTTPS URL. Update the corresponding `.env` files with the generated tunnel URLs.

See [developers/setup/cloudflare-tunnels.md](developers/setup/cloudflare-tunnels.md) for details.

## Branching Strategy

- Branch from `main`
- Name: `<type>/<short-description>` (e.g., `feat/add-slack-notifications`)
- Types: `feat`, `fix`, `docs`, `refactor`, `chore`, `build`, `ci`

## Commit Messages

Commit messages are enforced by a pre-commit hook (Husky + conventional commits).

Format: `type(scope): description`

Examples:

```
feat(api): add workspace member role filtering
fix(dash): resolve recording thumbnail loading
docs(sdk): update initialization guide
refactor(recorder): extract timeline into component
```

## Pull Requests

- Keep PRs small and focused
- Title follows conventional commit format
- Include what changed, why, and how to test
- Add screenshots for UI changes

## Code Style

- Prettier formats on commit (via lint-staged)
- ESLint for linting
- TypeScript strict mode
- Run `make check` before pushing (lint + typecheck + format)

## Where to Contribute

| Area             | Guide                                                            | What you'll work on           |
| ---------------- | ---------------------------------------------------------------- | ----------------------------- |
| Dashboard        | [developers/guides/dashboard.md](developers/guides/dashboard.md) | React UI, pages, components   |
| API              | [developers/guides/api.md](developers/guides/api.md)             | Endpoints, services, database |
| SDK              | [developers/guides/sdk.md](developers/guides/sdk.md)             | Browser recording SDK         |
| Marketing Site   | [developers/guides/home.md](developers/guides/home.md)           | Astro pages, landing pages    |
| Recorder         | [developers/guides/recorder.md](developers/guides/recorder.md)   | Session playback UI           |
| Chrome Extension | [developers/guides/extension.md](developers/guides/extension.md) | Browser extension             |
| MCP Apps         | [developers/guides/mcp.md](developers/guides/mcp.md)             | AI tool integrations          |
| Raycast          | [developers/guides/raycast.md](developers/guides/raycast.md)     | Raycast extension             |
| Intercom         | [developers/guides/intercom.md](developers/guides/intercom.md)   | Intercom integration          |
| Zendesk          | [developers/guides/zendesk.md](developers/guides/zendesk.md)     | Zendesk integration           |
| Slack            | [developers/guides/slack.md](developers/guides/slack.md)         | Slack integration             |
| Documentation    | [developers/guides/docs.md](developers/guides/docs.md)           | Mintlify docs site            |
| Demo App         | [developers/guides/ramp.md](developers/guides/ramp.md)           | Demo/showcase app             |

## Make Reference

Run `make help` for a full list of available commands. Key targets:

| Command          | Purpose                             |
| ---------------- | ----------------------------------- |
| `make dev`       | Start core apps                     |
| `make dev:api`   | Start API only                      |
| `make dev:dash`  | Start dashboard only                |
| `make check`     | Run lint + typecheck + format check |
| `make fix`       | Auto-fix lint + format issues       |
| `make db:push`   | Apply schema to database            |
| `make db:studio` | Open Drizzle Studio (database GUI)  |
| `make env:setup` | Copy .env.example files             |

## Getting Help

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones

## License

This project uses Apache-2.0 at the repository root, with workspace-specific
FSL-1.1-ALv2 exceptions declared in each app/package `LICENSE.md`.
