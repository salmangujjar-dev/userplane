---
title: 'Astro Integration'
excerpt: 'Install Userplane in an Astro application using client-side script blocks'
order: 13
lastUpdated: 2026-03-07
---

This guide covers how to install Userplane in an Astro application.

## Adding the script

The fastest way to add Userplane is the CDN embed. Add these two tags to the `<head>` of your base layout:

```astro
---
// src/layouts/Layout.astro
---

<html lang="en">
  <head>
    <meta name="userplane:workspace" content="YOUR_WORKSPACE_ID" />
    <script type="module" src="https://cdn.userplane.io/embed/script.js"></script>
  </head>
  <body>
    <slot />
  </body>
</html>
```

You can copy the snippet with your workspace ID pre-filled from **Workspace Settings > Domains** in the Userplane dashboard.

## npm SDK

Use the npm SDK when you need programmatic control — triggering recordings from a button, attaching user metadata, or reading recording state.

### Installation

```bash
npm install @userplane/sdk
```

### Initialization

Add a `<script>` block to your base layout. In Astro, `<script>` blocks in `.astro` files are bundled and run in the browser — no `client:` directive or SSR guard is needed.

```astro
---
// src/layouts/Layout.astro
const workspaceId = import.meta.env.PUBLIC_USERPLANE_WORKSPACE_ID;
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <slot name="head" />
  </head>
  <body>
    <slot />

    <script>
      import { initialize } from '@userplane/sdk';

      initialize({
        workspaceId: import.meta.env.PUBLIC_USERPLANE_WORKSPACE_ID,
      });
    </script>
  </body>
</html>
```

Set the variable in your `.env` file:

```
PUBLIC_USERPLANE_WORKSPACE_ID=ws_abc123
```

**Note:** `import.meta.env.PUBLIC_*` variables are inlined at build time by Vite. Access them inside `<script>` blocks (client-side), not in the frontmatter (server-side) — frontmatter runs at build/request time and has no access to browser APIs.

### URL parameters

Astro can be deployed as a static site or with a server adapter (SSR). For static deployments, Userplane reads URL parameters on the client automatically — no additional configuration is needed. For SSR deployments with redirects, preserve the `userplane-` prefixed parameters through any server-side redirect in your middleware:

```typescript
// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  if (!isAuthenticated(context) && requiresAuth(context.url.pathname)) {
    const loginUrl = new URL('/login', context.url.origin);

    for (const [key, value] of context.url.searchParams) {
      if (key.startsWith('userplane-')) {
        loginUrl.searchParams.set(key, value);
      }
    }

    return context.redirect(loginUrl.toString());
  }

  return next();
});
```

See [Setting Up Userplane Scripts](/help/developer-docs/setting-up-userplane-scripts) for the full list of parameters.

## Sensitive data

Add `data-userplane-blur` to any element you want blurred in recordings. See [Sensitive Data Redaction](/help/developer-docs/sensitive-data-redaction) for the full reference.

## Metadata

Call `set()` inside the `<script>` block after `initialize()`:

```astro
<script>
  import { initialize, set } from '@userplane/sdk';

  initialize({ workspaceId: import.meta.env.PUBLIC_USERPLANE_WORKSPACE_ID });
  set('environment', import.meta.env.MODE);
</script>
```

See [Metadata SDK](/help/developer-docs/metadata-sdk) for the full API.

## SSR

Astro's `<script>` blocks are always client-only — Astro bundles them separately from the server render. The frontmatter section (`---`) runs on the server (or at build time for static output) and has no access to `window`, `document`, or browser APIs.

| Context                                | Runs where          | Can call `initialize()`? |
| -------------------------------------- | ------------------- | ------------------------ |
| Frontmatter (`---`)                    | Server / build time | No                       |
| `<script>` block                       | Browser             | Yes                      |
| Framework component with `client:load` | Browser             | Yes                      |
| Framework component without `client:*` | Server only         | No                       |

`@userplane/sdk` is SSR-safe to import at the module level inside a `<script>` block. The module does not reference `window` at evaluation time.

## Example app

A complete Astro example is available at [github.com/wizenheimer/userplane-sdk-examples/tree/main/examples/astro](https://github.com/wizenheimer/userplane-sdk-examples/tree/main/examples/astro).

| Variable                        | Description                 |
| ------------------------------- | --------------------------- |
| `PUBLIC_USERPLANE_WORKSPACE_ID` | Your Userplane workspace ID |

```bash
cd examples/astro && npm install && npm run dev
```

## Related articles

- [Setting Up Userplane Scripts](/help/developer-docs/setting-up-userplane-scripts) — CDN script placement, CSP, and redirect handling.
- [Web SDK](/help/developer-docs/web-sdk) — full SDK API reference.
- [Metadata SDK](/help/developer-docs/metadata-sdk) — attach user context to recordings.
- [Sensitive Data Redaction](/help/developer-docs/sensitive-data-redaction) — blur sensitive content in recordings.
