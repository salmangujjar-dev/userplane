# Contributing to Documentation

Public-facing documentation site built with Mintlify. Covers SDK setup, API reference, integrations, and platform guides.

## Prerequisites

- [ ] Base setup complete (see [Quick Start](../../CONTRIBUTING.md))
- [ ] Node.js >= 22 (docs use `fnm exec --using=22`; install via [fnm](https://github.com/Schniz/fnm))

No external services required.

## Architecture

```
apps/docs/
  docs.json              # Mintlify configuration (navigation, theme, metadata)
  openapi.json           # Generated OpenAPI spec (do not edit manually)
  chatgpt-app-submission.json # Generated ChatGPT app review artifact (do not edit manually)
  introduction.mdx       # Landing page
  quickstart.mdx         # Getting started guide
  getting-started/       # Onboarding guides
  developer/             # SDK and developer documentation
  api/                   # API reference pages
  integrations/          # Integration guides
  recording/             # Recording feature docs
  recording-links/       # Share link docs
  frameworks/            # Framework-specific guides
  platforms/             # Platform-specific guides
  billing/               # Billing documentation
  account/               # Account management docs
  workspace/             # Workspace docs
  support/               # Support docs
  media/                 # Images and assets
  static/                # Static files
```

Pages are `.mdx` files (Markdown + JSX). Navigation structure is defined in `docs.json`.

## Development Workflow

```sh
make dev:docs            # Port 3005
```

The docs dev server hot-reloads on file changes. Open http://localhost:3005 to preview.

## Key Files

| File                                    | Purpose                                     |
| --------------------------------------- | ------------------------------------------- |
| `apps/docs/docs.json`                   | Navigation, theme, metadata configuration   |
| `apps/docs/openapi.json`                | OpenAPI spec for API reference (generated)  |
| `apps/docs/chatgpt-app-submission.json` | ChatGPT app submission artifact (generated) |
| `apps/docs/introduction.mdx`            | Documentation landing page                  |
| `apps/docs/quickstart.mdx`              | Getting started guide                       |

## Common Tasks

### Adding a new page

1. Create an `.mdx` file in the appropriate directory
2. Add the page to the navigation in `docs.json`
3. Use Mintlify components for callouts, cards, code blocks, etc.

### Updating the API reference

1. If API contracts changed, regenerate the OpenAPI spec:
   ```sh
   make generate:openapi
   ```
2. The API reference pages auto-generate from `openapi.json`

### Updating MCP app review artifacts

1. If MCP tool definitions or annotations changed, regenerate the ChatGPT app submission:
   ```sh
   make generate:chatgpt-app-submission
   ```
2. Upload `apps/docs/chatgpt-app-submission.json` in the OpenAI Platform app review flow

### Adding images

1. Place images in `apps/docs/media/`
2. Reference with relative paths in MDX files

## Testing

1. Open http://localhost:3005
2. Navigate to the page you changed
3. Verify rendering, links, and code blocks
4. Check mobile responsiveness

## Notes

- Do not edit `openapi.json` or `chatgpt-app-submission.json` manually — they are generated from API/MCP contracts
- Docs are hosted by Mintlify (not self-hosted)
- Use code blocks with copy instead of the Mintlify Prompt component
- Keep card descriptions minimal — no paragraphs
- Ground documentation in actual contract schemas — never fabricate API shapes
