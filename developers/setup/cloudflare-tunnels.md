# Cloudflare Tunnels

HTTPS tunnels that expose local development servers to the internet. Required for testing webhooks, OAuth callbacks, and cross-device access.

## When you need this

Webhook integrations (Slack, DodoPayments), OAuth flows, testing from a mobile device, or any scenario requiring a public URL pointing to your local machine.

## Setup

1. Install `cloudflared`:

   **macOS:**

   ```sh
   brew install cloudflared
   ```

   **Linux (Debian/Ubuntu):**

   ```sh
   sudo apt-get install cloudflared
   ```

2. No Cloudflare account is needed. Ephemeral tunnels work without authentication.

3. Start a tunnel for each app you need to expose. Each tunnel runs in a separate terminal:

   ```sh
   # Terminal 1 -- API
   cloudflared tunnel --url http://localhost:3001

   # Terminal 2 -- Dashboard
   cloudflared tunnel --url http://localhost:3000

   # Terminal 3 -- Recorder
   cloudflared tunnel --url http://localhost:4322
   ```

4. Each command outputs a `*.trycloudflare.com` URL. Copy these URLs.

## Environment Variables

Update the following `.env.development` files with the generated tunnel URLs.

`apps/api/.env.development`:

```
BETTER_AUTH_URL=https://[api-tunnel].trycloudflare.com
CORS_ORIGINS=https://[dash-tunnel].trycloudflare.com
BETTER_AUTH_COOKIE_DOMAIN=[api-tunnel].trycloudflare.com
```

`apps/dash/.env.development`:

```
NEXT_PUBLIC_API_URL=https://[api-tunnel].trycloudflare.com
NEXT_PUBLIC_DASHBOARD_URL=https://[dash-tunnel].trycloudflare.com
NEXT_PUBLIC_RECORDER_URL=https://[recorder-tunnel].trycloudflare.com
```

Replace the `[*-tunnel]` placeholders with the actual subdomains from `cloudflared` output.

## Verify

Open the dashboard tunnel URL in a browser. The page should load and communicate with the API tunnel URL without CORS errors.

## Notes

- Each tunnel is a separate process. Closing the terminal kills the tunnel.
- URLs are ephemeral. They change every time you restart a tunnel. Update `.env` files accordingly.
- Ephemeral tunnels have a limit of 200 concurrent requests.
- SSE (Server-Sent Events) is not supported through ephemeral tunnels.
