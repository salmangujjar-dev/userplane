# Zendesk

Support platform integration.

## When you need this

Any work involving the Zendesk integration in the API server (`apps/api`), dashboard (`apps/dash`), or the Zendesk app package (`packages/zendesk`).

## Setup

1. Sign up for a trial account at [zendesk.com/register/free-trial](https://www.zendesk.com/register/free-trial/). The trial lasts 14 days.
2. For a non-expiring sponsored developer account, prefix your subdomain with `d3v-` during signup and submit the form at [forms.gle/NDkrqK9xkZrnWoyk9](https://forms.gle/NDkrqK9xkZrnWoyk9).
3. Navigate to **Admin Center** > **Apps and integrations** > **APIs** > **OAuth clients**.
4. Click **Add OAuth client** and fill in the following:
   - **Name**: your app name
   - **Identifier**: a unique slug (this becomes the Client ID)
   - **Redirect URL**: your dashboard tunnel URL:
     ```
     https://{your-dash-tunnel}/callback/zendesk
     ```
5. Save the client. Copy the **Client ID** (the Identifier) and **Client Secret**. The secret is shown fully only once.
6. Generate a JWT secret for Zendesk app authentication:
   ```sh
   openssl rand -base64 32
   ```

## Environment Variables

Set the following in `apps/api/.env.development`:

```
ZENDESK_CLIENT_ID=xxxx
ZENDESK_CLIENT_SECRET=xxxx
ZENDESK_REDIRECT_URI=https://{your-dash-tunnel}/callback/zendesk
ZENDESK_JWT_SECRET=xxxx
```

Set the following in the Zendesk app package (`packages/zendesk`):

```
ZENDESK_IFRAME_URL=https://{your-dash-tunnel}/zendesk/iframe
ZENDESK_DOMAIN_WHITELIST={your-zendesk-subdomain}.zendesk.com
```

Replace `{your-dash-tunnel}` with your actual dashboard tunnel URL and `{your-zendesk-subdomain}` with your Zendesk subdomain.

## Verify

Start the API server and dashboard, then initiate a Zendesk OAuth flow from the dashboard. You should be redirected to Zendesk's authorization screen and back to the callback URL.

## Notes

- Sponsored developer accounts are free, support up to 5 agents, and do not expire.
- Sponsored accounts cannot be used for real customer support operations.
- The Client Secret is displayed fully only once during creation. Store it immediately.
