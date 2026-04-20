# Google OAuth

Google sign-in for user authentication.

## When you need this

Any work involving user authentication or sign-in flows in the API server (`apps/api`) or dashboard (`apps/dash`).

## Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a new project (or select an existing one).
2. Enable the **Google People API**: navigate to **APIs & Services** > **Library**, search for "Google People API", and click **Enable**.
3. Configure the OAuth consent screen: navigate to **APIs & Services** > **OAuth consent screen**, select **External**, and fill in the required fields (app name, user support email, developer contact email).
4. Create credentials: navigate to **APIs & Services** > **Credentials** > **+ Create Credentials** > **OAuth client ID**. Select **Web application** as the application type.
5. Under **Authorized redirect URIs**, add your API tunnel URL followed by the callback path:
   ```
   https://{your-api-tunnel}/api/auth/callback/google
   ```
6. Copy the **Client ID** and **Client Secret**.

## Environment Variables

Set the following in `apps/api/.env.development`:

```
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
GOOGLE_REDIRECT_URI=https://{your-api-tunnel}/api/auth/callback/google
```

Replace `{your-api-tunnel}` with your actual tunnel URL.

## Verify

Start the API server and initiate a Google sign-in flow. You should be redirected to Google's consent screen and back to the callback URL after authorization.

## Notes

- Google OAuth is free.
- The OAuth consent screen must be configured before credentials can be created.
- Redirect URIs must be exact matches — trailing slashes and path differences cause failures.
- Unverified apps display a warning screen to users. This is expected during development.
