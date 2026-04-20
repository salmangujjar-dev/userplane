# Contributing to the Slack Integration

Connect Userplane recordings to Slack channels. Send recording notifications and surface session data in Slack.

## Prerequisites

- [ ] Base setup complete (see [Quick Start](../../CONTRIBUTING.md))
- [ ] PostgreSQL configured (see [Neon](../setup/neon.md) or [Supabase](../setup/supabase.md))
- [ ] Cloudflare Tunnels running (see [Tunnels](../setup/cloudflare-tunnels.md))
- [ ] Slack app configured (see [Slack App](../setup/slack-app.md))

## Architecture

```
apps/api/src/services/
  slack-oauth.service.ts         # OAuth V2 token exchange
  slack-canvas.service.ts        # Canvas rendering in Slack
  slack-notification.service.ts  # Recording notifications to channels
apps/dash/src/app/slack/         # Dashboard integration UI
packages/db/src/schema/integrations.ts  # Token storage
```

**Data flow:**

1. Admin installs Slack app via OAuth V2 flow in the dashboard
2. OAuth callback exchanges code for bot token (`xoxb-`)
3. Notifications post recording links to configured Slack channels
4. Incoming Slack webhooks are verified using the Signing Secret (HMAC-SHA256)

**Token storage:** `{ accessToken, botUserId, appId, authedUserId }`

**Provider metadata:** `{ teamId, teamName, enterpriseId?, isEnterpriseInstall? }`

## Development Workflow

```sh
make dev        # Start all core apps
```

Tunnels needed for Dashboard (OAuth redirect) and API (webhook verification).

## Key Files

| File                                                  | Purpose                  |
| ----------------------------------------------------- | ------------------------ |
| `apps/api/src/services/slack-oauth.service.ts`        | OAuth V2 flow            |
| `apps/api/src/services/slack-canvas.service.ts`       | Canvas rendering         |
| `apps/api/src/services/slack-notification.service.ts` | Channel notifications    |
| `apps/dash/src/app/slack/`                            | Dashboard integration UI |
| `packages/db/src/schema/integrations.ts`              | Token storage            |

## Common Tasks

### Adding new Slack message formats

1. Edit `slack-notification.service.ts`
2. Use Slack's Block Kit format for rich messages
3. Test by triggering a notification and checking the Slack channel

### Modifying OAuth scopes

1. Update scope request in `slack-oauth.service.ts`
2. Update scopes in the Slack app settings (api.slack.com/apps → OAuth & Permissions)
3. Re-install the app to get a new token with updated scopes

### Updating webhook verification

1. Slack signs all incoming requests with the Signing Secret using HMAC-SHA256
2. Verification logic is in the webhook handler
3. The Signing Secret is different from the Client Secret

## Testing

1. Complete the OAuth flow: Dashboard → Integrations → Slack → Connect
2. Verify the bot token is stored in the database
3. Trigger a recording notification — verify the message appears in the configured Slack channel
4. Test webhook delivery by interacting with the Slack app

## Environment Variables

```
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_SIGNING_SECRET=
SLACK_REDIRECT_URI=https://{your-dash-tunnel}/callback/slack
```
