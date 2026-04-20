# Unkey

API key management for the public API.

## When you need this

Any work involving API key creation, verification, or rate limiting in the API server (`apps/api`).

## Setup

1. Sign up at [app.unkey.com](https://app.unkey.com).
2. Create a new API from the dashboard. Copy the **API ID** (format: `api_xxxx`).
3. Navigate to **Workspace Settings** > **Root Keys**.
4. Generate a new root key. Copy it immediately — it is not shown again.

## Environment Variables

Set the following in `apps/api/.env.development`:

```
UNKEY_ROOT_KEY=unkey_xxxx
UNKEY_API_ID=api_xxxx
```

## Verify

Start the API server and confirm that API key creation and verification endpoints respond successfully.

## Notes

- Free tier provides 1,000 keys, 150K verifications/month, and 7-day audit logs.
- The root key has full privilege over your Unkey workspace. Treat it like a database password and never commit it.
