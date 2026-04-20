# Contributing to the Marketing Site

Public-facing website with landing pages, pricing, blog, and legal content.

## Prerequisites

- [ ] Dependencies installed (`bun install` from monorepo root)

No external services are required. The site builds standalone.

## Architecture

The marketing site is an Astro 5 application with React 19 islands for interactive components. Content uses Astro content collections. Styling uses Tailwind CSS. OG images are generated at build time with Satori.

```
apps/home/src/
├── pages/            # Astro pages (file-based routing)
│   ├── index.astro   # Homepage
│   ├── pricing.astro # Pricing page
│   ├── blog/         # Blog listing and posts
│   ├── for/          # Use-case landing pages
│   ├── frameworks/   # Framework-specific pages
│   ├── integrations/ # Integration pages
│   ├── og/           # OG image generation endpoints
│   └── launch/       # Launch page
├── components/       # UI components (Astro + React)
├── content/          # Content collections (markdown)
│   └── legal/        # Terms, privacy policy
├── layouts/          # Page layouts
│   ├── BaseLayout.astro
│   ├── HomepageLayout.astro
│   ├── BlogLayout.astro
│   └── LegalLayout.astro
├── constants/        # Site-wide constants
├── lib/              # Utility functions
└── env/              # Environment configuration
```

Pages use Astro's static rendering by default. Interactive components use React islands with `client:load` or `client:visible` directives.

## Development Workflow

```bash
# Start dev server
make dev:home

# Build for production
make build:home

# Deploy to Cloudflare Pages
make deploy:home
```

Dev server runs on **http://localhost:4321**.

## Key Files

| File                                     | Purpose                              |
| ---------------------------------------- | ------------------------------------ |
| `apps/home/src/pages/index.astro`        | Homepage                             |
| `apps/home/src/pages/pricing.astro`      | Pricing page                         |
| `apps/home/src/pages/blog/`              | Blog pages                           |
| `apps/home/src/layouts/BaseLayout.astro` | Base HTML layout                     |
| `apps/home/src/content/`                 | Content collections                  |
| `apps/home/src/components/`              | Shared components                    |
| `apps/home/src/pages/og/`                | OG image generation                  |
| `packages/pricing/`                      | Pricing data (shared with dashboard) |

## Common Tasks

### Add a new landing page

1. Create a `.astro` file under `apps/home/src/pages/`.
2. Use an existing layout (e.g., `HomepageLayout`).
3. Add components under `apps/home/src/components/` as needed.
4. Each section gets its own components -- do not import components across page sections.

### Update pricing

Pricing data lives in `packages/pricing/`. Changes there propagate to both the marketing site and the dashboard.

### Add a blog post

1. Create a new `.astro` or `.md` file under `apps/home/src/pages/blog/`.
2. Use the `BlogLayout` layout.
3. OG images are generated automatically from page metadata.

### Modify OG images

OG images are generated using Satori in `apps/home/src/pages/og/`. Edit the JSX templates there to change image appearance.

### Add a content page

1. Add markdown content to `apps/home/src/content/`.
2. Register the collection in `apps/home/src/content.config.ts`.
3. Create an Astro page that queries the collection.

## Testing

1. Open **http://localhost:4321** in a browser.
2. Navigate to the changed pages.
3. Verify responsive design at mobile, tablet, and desktop breakpoints.
4. Check OG images by visiting `/og/{page-name}.png` endpoints.
5. Run a production build (`make build:home`) to catch SSR errors.
