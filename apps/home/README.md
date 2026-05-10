# Home

## Purpose

`apps/home` is the public Userplane website. It contains marketing pages, pricing, help, legal pages, blog scaffolding, framework and integration landing pages, role-specific pages, roadmap, SEO metadata, Open Graph image rendering, and LLM text endpoints.

The package name is `home`.

## Where It Fits

The home app is the public entry point for users before they enter the dashboard or docs:

- It links to `apps/dash` for sign-in, onboarding, dashboard actions, and calls to action.
- It references `apps/docs` for developer and support documentation.
- It reuses shared pricing and UI packages from the monorepo.
- It deploys separately from the app dashboard and API, with Cloudflare Pages commands in its package scripts.

## Stack

- Framework: Astro `6`.
- UI: React `19` islands, Tailwind CSS `4`, Lucide icons, and shared `@userplane/ui`.
- Content: Astro content collections, MDX, Markdown legal pages, and typed constants.
- SEO: sitemap integration, JSON-LD helpers, robots/LLMs endpoints, canonical URLs, and custom OG image rendering with Satori and Resvg.
- Media: custom Cloudflare image service and CDN/asset domain configuration.
- Deployment tooling: Wrangler for Cloudflare Pages.

## Local Development

From the repository root:

```bash
make dev:home
```

Or from this directory:

```bash
cd apps/home
bun run dev
```

The app runs on `http://localhost:4321`.

Useful commands:

```bash
bun run build
bun run build:production
bun run preview
bun run preview:cf
bun run lint
bun run typecheck
```

## Environment

Start from `apps/home/.env.example`. Astro exposes public runtime values through `PUBLIC_*` variables, and the env schema lives in `src/env/schema.ts`.

Important values:

- `PUBLIC_HOME_URL` - home site origin used for canonical URLs, navigation, and internal links.
- `PUBLIC_DASH_URL` - dashboard origin used for product CTAs and authenticated links.
- `PUBLIC_CDN_DOMAIN` - CDN domain for media assets.
- `PUBLIC_ASSETS_DOMAIN` - assets domain for uploaded/generated content.
- `PUBLIC_CLOUDFLARE_IMAGE_ZONE` - Cloudflare image transform zone.
- `PUBLIC_SKIP_IMAGE_TRANSFORM` - set to `true` to serve original image URLs.
- `PUBLIC_POSTHOG_KEY` and `PUBLIC_POSTHOG_HOST` - optional analytics.

Astro uses the `--mode` flag to set `import.meta.env.MODE`; this app does not require `APP_ENV` in its env file.

## Key Workflows

- Main website pages: `/`, `/pricing`, `/demo`, `/help`, `/roadmap`, `/privacy`, `/terms`, and `/launch`.
- Dynamic content pages: `/blog/[slug]`, `/frameworks/[slug]`, `/integrations/[slug]`, and `/for/[slug]`.
- Search/agent surfaces: `/llms.txt`, `/llms-full.txt`, Markdown-like page endpoints such as `/index.md.ts`, and `/.well-known/api-catalog`.
- SEO and social preview: `/og/[category]/[slug].png.ts` and `/og-preview`.
- Static/legal content: Markdown legal pages under `src/content/legal`.
- Framework, role, integration, pricing, navigation, help, footer, and UTM data live in `src/constants`.

## Important Directories

- `src/pages` - Astro routes and endpoint files.
- `src/components` - page sections and React/Astro UI for home, pricing, help, roles, frameworks, integrations, layout, blog, and launch pages.
- `src/constants` - typed content data for navigation, pricing, pages, integrations, frameworks, roles, footer, FAQ, help, and URLs.
- `src/content` - content collections and legal Markdown.
- `src/layouts` - base, homepage, blog, launch, and legal layouts.
- `src/env` - env defaults, schema, and parser.
- `src/lib` - media helpers, Cloudflare image service, SEO labels, and OG image rendering.
- `src/types` - shared content and page data types.
- `astro.config.mjs` - site config, routes behavior, integrations, image service, and dev server port.

## Checks

From this directory:

```bash
bun run lint
bun run typecheck
bun run build
```

`bun run typecheck` runs `astro check`.

From the root:

```bash
make build:home
```

## Deployment/Release

Local production preview:

```bash
bun run build:production
bun run preview:cf
```

Cloudflare Pages deploy scripts:

```bash
bun run deploy
bun run deploy:production
```

Root Make targets:

```bash
make preview:home
make deploy:home
make deploy:home:production
```

The production deploy target prompts before deploying to production.

## Related Docs

- `apps/home/.env.example`
- `apps/home/astro.config.mjs`
- `apps/home/src/env/schema.ts`
- `apps/dash/README.md`
- `apps/docs/README.md`
- `packages/pricing`
- `packages/ui`
