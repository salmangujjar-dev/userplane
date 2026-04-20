# Intercom

Customer communication platform integration.

## When you need this

Any work involving the Intercom integration in the API server (`apps/api`) or dashboard (`apps/dash`), including OAuth flows and webhook handling.

## Setup

1. Create a free developer workspace at [app.intercom.com/admins/sign_up/developer](https://app.intercom.com/admins/sign_up/developer).
2. Go to the Developer Hub: [app.intercom.com/a/apps/\_/developer-hub](https://app.intercom.com/a/apps/_/developer-hub).
3. Click **New app** to create a new application.
4. On the app's **Authentication** page, enable **OAuth**.
5. On the **Basic Information** page, copy the **Client ID** and **Client Secret**.
6. Configure the redirect URL on the Authentication page. It must be HTTPS — use your tunnel URL:
   ```
   https://{your-dash-tunnel}/callback/intercom
   ```

## Environment Variables

Set the following in `apps/api/.env.development`:

```
INTERCOM_CLIENT_ID=xxxx
INTERCOM_CLIENT_SECRET=xxxx
INTERCOM_REDIRECT_URI=https://{your-dash-tunnel}/callback/intercom
```

Replace `{your-dash-tunnel}` with your actual dashboard tunnel URL.

## Verify

Start the API server and dashboard, then initiate an Intercom OAuth flow from the dashboard. You should be redirected to Intercom's authorization screen and back to the callback URL.

## Notes

- Developer workspaces are free.
- Redirect URLs must use HTTPS. HTTP URLs are rejected.
- Public apps must be developed using a developer workspace, not a production workspace.
