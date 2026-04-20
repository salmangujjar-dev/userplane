# PostHog

Product analytics and error tracking.

## When you need this

Optional for most development work. Analytics features degrade gracefully without it. Required only when working on analytics dashboards, event tracking, or session replay features.

## Setup

1. Sign up at [app.posthog.com/signup](https://app.posthog.com/signup). No credit card required.
2. Create a project (or use the default one).
3. Navigate to **Project settings** and copy the **Project API Key**.
4. Copy the **Host** value from the same page (typically `https://us.i.posthog.com` or `https://eu.i.posthog.com`).

## Environment Variables

Set the following in the relevant app's `.env.development`:

**Dashboard** (`apps/dash`):

```
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**Home** (`apps/home`):

```
PUBLIC_POSTHOG_KEY=phc_xxxx
PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**Extension** (`apps/extension`):

```
WXT_POSTHOG_KEY=phc_xxxx
WXT_POSTHOG_HOST=https://us.i.posthog.com
```

**API** (`apps/api`):

```
POSTHOG_PROJECT_API_KEY=phc_xxxx
POSTHOG_HOST=https://us.i.posthog.com
```

## Verify

Start the relevant app and confirm analytics events appear in the PostHog dashboard under **Activity** > **Live events**.

## Notes

- Free tier provides 1M events/month, 5K session recordings, and 1 project.
- The Project API Key is a public token. It is safe to use in frontend code and is not a secret.
