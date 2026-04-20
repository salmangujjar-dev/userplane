# Contributing to the Intercom Integration

Connect Userplane recordings to Intercom conversations. Surface session replay data directly inside the Intercom inbox.

## Prerequisites

- [ ] Base setup complete (see [Quick Start](../../CONTRIBUTING.md))
- [ ] PostgreSQL configured (see [Neon](../setup/neon.md) or [Supabase](../setup/supabase.md))
- [ ] Cloudflare Tunnels running (see [Tunnels](../setup/cloudflare-tunnels.md))
- [ ] Intercom developer workspace configured (see [Intercom App](../setup/intercom-app.md))

## Architecture

```
apps/api/src/services/
  intercom-oauth.service.ts      # OAuth token exchange
  intercom-canvas.service.ts     # Canvas rendering in Intercom UI
  intercom-notification.service.ts  # Recording link notifications
apps/api/src/clients/
  intercom.ts                    # Intercom API client
apps/dash/src/components/integrations/intercom/  # Dashboard UI
apps/dash/src/app/oauth/intercom/                # OAuth callback handler
packages/contract/                # Integration schemas (Zod)
packages/db/src/schema/integrations.ts           # Token storage
```

**Data flow:**

1. Admin installs Intercom app via OAuth flow in the dashboard
2. OAuth callback exchanges code for access token, stored in `integrations` table
3. Intercom calls the canvas endpoint to render recording data
4. Notifications push recording links to Intercom conversations

**Token storage:** `{ accessToken: string }`

**Provider metadata:** `{ region: 'US' | 'EU' | 'AU' }`

**Regional API endpoints:** `api.intercom.io`, `eu.intercom.io`, `au.intercom.io`

## Development Workflow

```sh
make dev        # Start all core apps (API + Dashboard)
```

Ensure tunnels are running for both API and Dashboard — Intercom OAuth requires HTTPS redirect URIs.

## Key Files

| File                                                     | Purpose                          |
| -------------------------------------------------------- | -------------------------------- |
| `apps/api/src/services/intercom-oauth.service.ts`        | OAuth flow and token exchange    |
| `apps/api/src/services/intercom-canvas.service.ts`       | Canvas rendering for Intercom UI |
| `apps/api/src/services/intercom-notification.service.ts` | Notification delivery            |
| `apps/api/src/clients/intercom.ts`                       | HTTP client for Intercom API     |
| `apps/dash/src/components/integrations/intercom/`        | Dashboard integration UI         |
| `packages/db/src/schema/integrations.ts`                 | Integration token storage        |

## Common Tasks

### Modifying the canvas view

1. Edit `apps/api/src/services/intercom-canvas.service.ts`
2. Canvas data is rendered inside Intercom's inbox — use Intercom's Canvas Kit format
3. Test by opening a conversation in Intercom with a linked user

### Updating OAuth scopes

1. Update scope request in `intercom-oauth.service.ts`
2. Update the Intercom app configuration in the Developer Hub
3. Re-authorize to get a new token with updated scopes

### Updating notification format

1. Edit `intercom-notification.service.ts`
2. Modify the message payload sent to Intercom conversations

## Testing

1. Complete the OAuth flow: Dashboard → Integrations → Intercom → Connect
2. Verify the access token is stored in the database
3. Open a conversation in Intercom — verify the Intercom app renders recording data
4. Trigger a notification — verify the message appears in the conversation

## Environment Variables

```
INTERCOM_CLIENT_ID=
INTERCOM_CLIENT_SECRET=
INTERCOM_REDIRECT_URI=https://{your-dash-tunnel}/callback/intercom
```
