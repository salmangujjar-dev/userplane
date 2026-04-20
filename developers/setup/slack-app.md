# Slack

Team communication integration.

## When you need this

Any work involving the Slack integration in the API server (`apps/api`) or dashboard (`apps/dash`), including OAuth flows, bot messaging, or webhook handling.

## Setup

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and click **Create New App** > **From scratch**.
2. Enter an app name and select the workspace to install it in.
3. On **Basic Information** > **App Credentials**, copy the following:
   - **Client ID**
   - **Client Secret**
   - **Signing Secret**
4. Navigate to **OAuth & Permissions** and configure:
   - Under **Bot Token Scopes**, add: `chat:write`, `channels:history`, `channels:read`, `users:read`.
   - Under **Redirect URLs**, add:
     ```
     https://{your-dash-tunnel}/callback/slack
     ```
5. Navigate to **Install App** and click **Install to Workspace**. Authorize the app to receive a Bot Token (`xoxb-` prefix).

## Environment Variables

Set the following in `apps/api/.env.development`:

```
SLACK_CLIENT_ID=xxxx
SLACK_CLIENT_SECRET=xxxx
SLACK_SIGNING_SECRET=xxxx
SLACK_REDIRECT_URI=https://{your-dash-tunnel}/callback/slack
```

Replace `{your-dash-tunnel}` with your actual dashboard tunnel URL.

## Verify

Start the API server and dashboard, then initiate a Slack OAuth flow from the dashboard. You should be redirected to Slack's authorization screen and back to the callback URL.

## Notes

- Slack apps are free to create and use.
- The Signing Secret is used for verifying inbound webhook payloads via HMAC-SHA256. It is not the same as the Client Secret and must not be confused with it.
- Redirect URLs must be exact matches. Trailing slashes and path differences cause failures.
