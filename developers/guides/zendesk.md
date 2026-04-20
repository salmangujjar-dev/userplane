# Contributing to the Zendesk Integration

Connect Userplane recordings to Zendesk tickets. Embed session replay data inside the Zendesk agent workspace.

## Prerequisites

- [ ] Base setup complete (see [Quick Start](../../CONTRIBUTING.md))
- [ ] PostgreSQL configured (see [Neon](../setup/neon.md) or [Supabase](../setup/supabase.md))
- [ ] Cloudflare Tunnels running (see [Tunnels](../setup/cloudflare-tunnels.md))
- [ ] Zendesk sandbox configured (see [Zendesk App](../setup/zendesk-app.md))

## Architecture

```
apps/api/src/services/
  zendesk-oauth.service.ts       # OAuth token exchange
  zendesk-app.service.ts         # JWT-based app authentication (HS256)
  zendesk-connect.service.ts     # Connection management
apps/dash/src/app/zendesk/       # Dashboard iframe (served inside Zendesk)
packages/zendesk/                # Zendesk app manifest packaging
  .env.example                   # Manifest-specific env vars
packages/db/src/schema/integrations.ts  # Token storage
```

**Data flow:**

1. Admin installs Zendesk app via OAuth flow in the dashboard
2. OAuth callback exchanges code for access + refresh tokens
3. Zendesk loads the app as an iframe pointing to the dashboard
4. JWT-based auth (HS256) authenticates requests from the Zendesk iframe

**Token storage:** `{ accessToken, refreshToken?, tokenExpiresAt?, refreshTokenExpiresAt? }`

**Provider metadata:** `{ subdomain: string }`

## Development Workflow

```sh
make dev        # Start all core apps
```

Tunnels needed for both API (OAuth callbacks) and Dashboard (iframe URL served to Zendesk).

## Key Files

| File                                               | Purpose                           |
| -------------------------------------------------- | --------------------------------- |
| `apps/api/src/services/zendesk-oauth.service.ts`   | OAuth flow                        |
| `apps/api/src/services/zendesk-app.service.ts`     | JWT app authentication            |
| `apps/api/src/services/zendesk-connect.service.ts` | Connection management             |
| `apps/dash/src/app/zendesk/`                       | Iframe UI rendered inside Zendesk |
| `packages/zendesk/`                                | App manifest and packaging        |
| `packages/db/src/schema/integrations.ts`           | Token storage                     |

## Common Tasks

### Modifying the Zendesk iframe UI

1. Edit files in `apps/dash/src/app/zendesk/`
2. The iframe loads inside the Zendesk agent workspace sidebar
3. Test by opening a ticket in Zendesk — the app sidebar should render your changes

### Updating the manifest

1. Edit the manifest configuration in `packages/zendesk/`
2. Update env vars in `packages/zendesk/.env.development`:
   - `ZENDESK_IFRAME_URL` — your dashboard tunnel URL + `/zendesk/iframe`
   - `ZENDESK_DOMAIN_WHITELIST` — your Zendesk subdomain

### Modifying JWT authentication

1. Edit `apps/api/src/services/zendesk-app.service.ts`
2. JWT uses HS256 with the `ZENDESK_JWT_SECRET`
3. The secret is shared between Userplane and Zendesk during OAuth setup

## Testing

1. Complete the OAuth flow: Dashboard → Integrations → Zendesk → Connect
2. Verify tokens stored in the database
3. Open a ticket in Zendesk — verify the app sidebar shows recording data
4. Test token refresh by waiting for expiration

## Environment Variables

```
ZENDESK_CLIENT_ID=
ZENDESK_CLIENT_SECRET=
ZENDESK_REDIRECT_URI=https://{your-dash-tunnel}/callback/zendesk
ZENDESK_JWT_SECRET=           # Generate: openssl rand -base64 32
ZENDESK_IFRAME_URL=https://{your-dash-tunnel}/zendesk/iframe
ZENDESK_DOMAIN_WHITELIST={subdomain}.zendesk.com
```
