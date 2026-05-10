# Developer Documentation

Everything a contributor needs to get productive in the Userplane monorepo. Pick the area you want to work on, set up the required services, and follow the guide.

## Start Here

| Document                                 | Use it for                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| [Root README](../README.md)              | Product overview, architecture, quickstart, commands, and public-facing repo map            |
| [Apps README](../apps/README.md)         | Runnable app inventory, ports, workflows, environments, and app-specific READMEs            |
| [Packages README](../packages/README.md) | Shared package inventory, import surfaces, consumers, scripts, and package-specific READMEs |
| [Contributing](../CONTRIBUTING.md)       | Branching, commits, PR expectations, and contribution checklist                             |

## Setup Guides

| Guide                                             | Service                  | Free Tier                   | Needed For           |
| ------------------------------------------------- | ------------------------ | --------------------------- | -------------------- |
| [Neon](setup/neon.md)                             | Managed PostgreSQL       | 0.5 GB storage              | All areas            |
| [Supabase](setup/supabase.md)                     | Managed PostgreSQL (alt) | 500 MB storage              | All areas            |
| [Cloudflare Tunnels](setup/cloudflare-tunnels.md) | HTTPS tunnels            | Unlimited                   | API, integrations    |
| [Upstash](setup/upstash.md)                       | Managed Redis            | 256 MB, 500K cmds/mo        | Cache, rate limiting |
| [Inngest](setup/inngest.md)                       | Background jobs          | Local dev server            | Background jobs      |
| [DodoPayments](setup/dodopayments.md)             | Payment processing       | Test mode                   | Billing features     |
| [Resend](setup/resend.md)                         | Email delivery           | 100/day                     | Email features       |
| [PostHog](setup/posthog.md)                       | Analytics                | 1M events/mo                | Analytics            |
| [Unkey](setup/unkey.md)                           | API key management       | 1K keys, 150K verifications | Public API           |
| [Google OAuth](setup/google-oauth.md)             | Google sign-in           | Free                        | Google auth          |
| [Intercom App](setup/intercom-app.md)             | Intercom OAuth           | Free dev workspace          | Intercom integration |
| [Zendesk App](setup/zendesk-app.md)               | Zendesk OAuth            | Sponsored dev account       | Zendesk integration  |
| [Slack App](setup/slack-app.md)                   | Slack OAuth              | Free                        | Slack integration    |
| [Cloudflare R2](setup/cloudflare-r2.md)           | Object storage           | 10 GB                       | Storage features     |

## Contribution Guides

| Area             | Guide                                      | Prerequisites                        |
| ---------------- | ------------------------------------------ | ------------------------------------ |
| Dashboard        | [guides/dashboard.md](guides/dashboard.md) | Neon/Supabase                        |
| API              | [guides/api.md](guides/api.md)             | Neon/Supabase, Tunnels               |
| SDK              | [guides/sdk.md](guides/sdk.md)             | None                                 |
| Marketing Site   | [guides/home.md](guides/home.md)           | None                                 |
| Recorder         | [guides/recorder.md](guides/recorder.md)   | Neon/Supabase                        |
| Chrome Extension | [guides/extension.md](guides/extension.md) | Neon/Supabase                        |
| MCP Apps         | [guides/mcp.md](guides/mcp.md)             | Neon/Supabase                        |
| Raycast          | [guides/raycast.md](guides/raycast.md)     | Unkey                                |
| Intercom         | [guides/intercom.md](guides/intercom.md)   | Neon/Supabase, Tunnels, Intercom App |
| Zendesk          | [guides/zendesk.md](guides/zendesk.md)     | Neon/Supabase, Tunnels, Zendesk App  |
| Slack            | [guides/slack.md](guides/slack.md)         | Neon/Supabase, Tunnels, Slack App    |
| Documentation    | [guides/docs.md](guides/docs.md)           | None                                 |
| Demo App         | [guides/ramp.md](guides/ramp.md)           | None                                 |
