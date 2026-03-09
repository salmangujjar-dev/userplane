---
title: 'Nuxt 3 Integration'
excerpt: 'Install Userplane in a Nuxt 3 application using a browser-only client plugin'
order: 10
lastUpdated: 2026-03-07
---

This guide covers how to install Userplane in a Nuxt 3 application.

## Adding the script

The fastest way to add Userplane is the CDN embed. Add these two tags to the `<head>` in `nuxt.config.ts`:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      meta: [{ name: 'userplane:workspace', content: 'YOUR_WORKSPACE_ID' }],
      script: [{ type: 'module', src: 'https://cdn.userplane.io/embed/script.js' }],
    },
  },
});
```

You can copy the snippet with your workspace ID pre-filled from **Workspace Settings > Domains** in the Userplane dashboard.

## npm SDK

Use the npm SDK when you need programmatic control — triggering recordings from a button, attaching user metadata, or reading recording state.

### Installation

```bash
npm install @userplane/sdk
```

### Initialization

Create a plugin file with the `.client.ts` suffix. Nuxt only runs `.client.ts` plugins in the browser, so no additional SSR guard is needed.

```typescript
// plugins/userplane.client.ts
export default defineNuxtPlugin(async () => {
  const { initialize } = await import('@userplane/sdk');
  const config = useRuntimeConfig();

  initialize({
    workspaceId: config.public.userplaneWorkspaceId,
  });
});
```

Expose the workspace ID through Nuxt's runtime config so it is available on both server and client:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      userplaneWorkspaceId: '',
    },
  },
});
```

Set the value in your `.env` file:

```
NUXT_PUBLIC_USERPLANE_WORKSPACE_ID=ws_abc123
```

Nuxt automatically maps `NUXT_PUBLIC_*` environment variables to `runtimeConfig.public.*`.

### URL parameters

When a customer opens a recording link, Userplane appends `userplane-token` and `userplane-action` to the URL. If your app uses Nuxt middleware to redirect unauthenticated users, preserve the `userplane-` prefixed parameters through the redirect:

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  if (!isAuthenticated()) {
    const query: Record<string, string> = {};

    for (const [key, value] of Object.entries(to.query)) {
      if (key.startsWith('userplane-') && typeof value === 'string') {
        query[key] = value;
      }
    }

    return navigateTo({ path: '/login', query });
  }
});
```

See [Setting Up Userplane Scripts](/help/developer-docs/setting-up-userplane-scripts) for the full list of parameters.

## Sensitive data

Add `data-userplane-blur` to any element you want blurred in recordings. See [Sensitive Data Redaction](/help/developer-docs/sensitive-data-redaction) for the full reference.

## Metadata

Call `set()` inside the plugin after `initialize()`:

```typescript
// plugins/userplane.client.ts
export default defineNuxtPlugin(async () => {
  const { initialize, set } = await import('@userplane/sdk');
  const config = useRuntimeConfig();

  initialize({ workspaceId: config.public.userplaneWorkspaceId });
  set('environment', 'production');
});
```

See [Metadata SDK](/help/developer-docs/metadata-sdk) for the full API.

## SSR

The `.client.ts` suffix tells Nuxt to exclude this plugin from the server bundle entirely. You do not need `ssr: false` in `nuxt.config.ts` or any `process.client` guards inside the plugin.

`@userplane/sdk` is SSR-safe to import — it does not reference `window` or `document` at module evaluation time. The dynamic `import('@userplane/sdk')` inside the plugin is an optional optimization; a static import also works.

| Concern                                   | Safe? | Notes                              |
| ----------------------------------------- | ----- | ---------------------------------- |
| `.client.ts` plugin suffix                | Yes   | Nuxt excludes file from SSR bundle |
| Static `import` inside `.client.ts`       | Yes   | File never runs on server          |
| Dynamic `import('@userplane/sdk')`        | Yes   | Bundle-size optimization only      |
| Calling `initialize()` in a server plugin | No    | `window` is not available          |

## Example app

A complete Nuxt 3 example is available at [github.com/wizenheimer/userplane-sdk-examples/tree/main/examples/nuxt](https://github.com/wizenheimer/userplane-sdk-examples/tree/main/examples/nuxt).

| Variable                             | Description                 |
| ------------------------------------ | --------------------------- |
| `NUXT_PUBLIC_USERPLANE_WORKSPACE_ID` | Your Userplane workspace ID |

```bash
cd examples/nuxt && npm install && npm run dev
```

## Related articles

- [Setting Up Userplane Scripts](/help/developer-docs/setting-up-userplane-scripts) — CDN script placement, CSP, and redirect handling.
- [Web SDK](/help/developer-docs/web-sdk) — full SDK API reference.
- [Metadata SDK](/help/developer-docs/metadata-sdk) — attach user context to recordings.
- [Sensitive Data Redaction](/help/developer-docs/sensitive-data-redaction) — blur sensitive content in recordings.
