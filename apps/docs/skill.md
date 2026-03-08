---
name: userplane
description: >-
  Integrate Userplane screen recording into web applications.
  Covers CDN embed installation, npm SDK setup for React, Next.js, Vue, Angular,
  Nuxt, SvelteKit, Astro, TanStack Start, and static HTML, custom metadata,
  sensitive data redaction (blur), and programmatic recorder control.
  Use when adding, configuring, or troubleshooting Userplane in a web project.
license: MIT
compatibility: Works with any modern web framework. npm SDK requires a JavaScript build step. CDN embed requires no build step.
metadata:
  author: userplane
  version: '1.0'
---

# Userplane Integration

## CDN Embed (zero-code)

Add early in `<head>` on every page. Do not use `async` or `defer`.

```html
<meta name="userplane:workspace" content="YOUR_WORKSPACE_ID" />
<script type="module" src="https://cdn.userplane.io/embed/script.js"></script>
```

Replace `YOUR_WORKSPACE_ID` with workspace ID from **Workspace Settings > Domains**.

CSP: if your site sets `Content-Security-Policy`, add `*.userplane.io` to `frame-src` and `script-src`.

## npm SDK

Install for programmatic control (open/close recorder, attach metadata, query state):

```bash
npm install @userplane/sdk
```

SSR-safe to import — does not reference `window` at module evaluation. `initialize()` must run client-side.

## Framework Integrations

### React (Vite)

Create `src/providers/UserplaneProvider.tsx`:

```tsx
import { useEffect } from 'react';
import { initialize } from '@userplane/sdk';

export function UserplaneProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initialize({ workspaceId: import.meta.env.VITE_USERPLANE_WORKSPACE_ID });
  }, []);
  return <>{children}</>;
}
```

Wrap app in `src/main.tsx` with `<UserplaneProvider>`. Env var: `VITE_USERPLANE_WORKSPACE_ID`. Pure client-side — static import is fine, no SSR guard needed.

### Next.js (App Router)

Create `app/providers/userplane-provider.tsx`:

```tsx
'use client';
import { useEffect } from 'react';

export function UserplaneProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    import('@userplane/sdk').then(({ initialize }) => {
      initialize({ workspaceId: process.env.NEXT_PUBLIC_USERPLANE_WORKSPACE_ID! });
    });
  }, []);
  return <>{children}</>;
}
```

Mount in `app/layout.tsx`. Env var: `NEXT_PUBLIC_USERPLANE_WORKSPACE_ID`. `'use client'` required. Dynamic `import()` is optional — static import works since module is SSR-safe. Never call `initialize()` in a Server Component.

Preserve URL params in `middleware.ts`:

```typescript
export function middleware(request: NextRequest) {
  if (!checkAuth(request)) {
    const loginUrl = new URL('/login', request.url);
    for (const [key, value] of request.nextUrl.searchParams) {
      if (key.startsWith('userplane-')) loginUrl.searchParams.set(key, value);
    }
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}
```

### Vue 3 (Vite)

Create `src/plugins/userplane.ts`:

```typescript
import type { App } from 'vue';
import { initialize } from '@userplane/sdk';

export const userplanePlugin = {
  install(_app: App, options: { workspaceId: string }) {
    initialize({ workspaceId: options.workspaceId });
  },
};
```

Register in `src/main.ts`: `app.use(userplanePlugin, { workspaceId: import.meta.env.VITE_USERPLANE_WORKSPACE_ID })`. Env var: `VITE_USERPLANE_WORKSPACE_ID`. Pure client-side, no SSR guard needed. Preserve `userplane-` params in `router.beforeEach` guard.

### Angular

Create `src/app/initializers/userplane.initializer.ts`:

```typescript
import { initialize } from '@userplane/sdk';
import { environment } from '../../environments/environment';

export function provideUserplane() {
  return () => {
    initialize({ workspaceId: environment.userplaneWorkspaceId });
  };
}
```

Register in `src/app/app.config.ts` with `APP_INITIALIZER`:

```typescript
{ provide: APP_INITIALIZER, useFactory: provideUserplane, multi: true }
```

Set `userplaneWorkspaceId` in `src/environments/environment.ts`. Preserve `userplane-` params in auth guard via `route.queryParams`.

### Nuxt 3

Create `plugins/userplane.client.ts`:

```typescript
export default defineNuxtPlugin(async () => {
  const { initialize } = await import('@userplane/sdk');
  const config = useRuntimeConfig();
  initialize({ workspaceId: config.public.userplaneWorkspaceId });
});
```

Add to `nuxt.config.ts`: `runtimeConfig: { public: { userplaneWorkspaceId: '' } }`. Env var: `NUXT_PUBLIC_USERPLANE_WORKSPACE_ID` in `.env`. The `.client.ts` suffix excludes plugin from SSR. Preserve `userplane-` params in `middleware/auth.ts` via `navigateTo({ path: '/login', query })`.

### SvelteKit

Initialize in `src/routes/+layout.svelte`:

```svelte
<script>
  import { onMount } from 'svelte';
  import { PUBLIC_USERPLANE_WORKSPACE_ID } from '$env/static/public';

  onMount(async () => {
    const { initialize } = await import('@userplane/sdk');
    initialize({ workspaceId: PUBLIC_USERPLANE_WORKSPACE_ID });
  });
</script>
<slot />
```

Env var: `PUBLIC_USERPLANE_WORKSPACE_ID` in `.env`. `onMount` runs browser-only, no `ssr = false` needed. Preserve `userplane-` params in `src/hooks.server.ts`.

### Astro

Add `<script>` block in layout (e.g. `src/layouts/Layout.astro`):

```astro
<script>
  import { initialize } from '@userplane/sdk';
  initialize({ workspaceId: import.meta.env.PUBLIC_USERPLANE_WORKSPACE_ID });
</script>
```

Env var: `PUBLIC_USERPLANE_WORKSPACE_ID` in `.env`. Astro `<script>` blocks are always client-only. Never call `initialize()` in frontmatter. For SSR deployments, preserve `userplane-` params in `src/middleware.ts` using `defineMiddleware`.

### TanStack Start

Create `app/components/UserplaneProvider.tsx`:

```tsx
'use client';
import { useEffect } from 'react';

export function UserplaneProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    import('@userplane/sdk').then(({ initialize }) => {
      initialize({ workspaceId: import.meta.env.VITE_USERPLANE_WORKSPACE_ID });
    });
  }, []);
  return <>{children}</>;
}
```

Render in `app/routes/__root.tsx`. Env var: `VITE_USERPLANE_WORKSPACE_ID`. `useEffect` ensures browser-only. Never call `initialize()` in a loader.

TanStack Router validates search params — add Userplane params to root route schema:

```typescript
const searchSchema = z.object({
  'userplane-token': z.string().optional(),
  'userplane-action': z.string().optional(),
  'userplane-workspace': z.string().optional(),
});
export const Route = createRootRoute({ validateSearch: searchSchema, component: RootComponent });
```

Preserve params through auth redirects via `beforeLoad` + `throw redirect({ to: '/login', search: { ... } })`.

### Static HTML

No build step. Add CDN embed to `<head>`:

```html
<meta name="userplane:workspace" content="YOUR_WORKSPACE_ID" />
<script type="module" src="https://cdn.userplane.io/embed/script.js"></script>
```

URL params are read automatically. No additional config needed.

## Metadata SDK

Import from `@userplane/sdk`. Attach custom key-value data to recordings.

`set(key, value)` — static metadata:

```javascript
import { set } from '@userplane/sdk';
set('userId', 'usr_12345');
set('plan', 'business');
```

`metadata(fn)` — dynamic metadata called at recording submission:

```javascript
import { metadata } from '@userplane/sdk';
metadata(() => ({
  userId: getCurrentUser().id,
  page: window.location.pathname,
  featureFlags: getActiveFlags(),
}));
```

`clearMetadata(keyOrType?)` — clear all (`clearMetadata()`), function only (`'function'`), all static (`'static'`), or a specific key (`'userId'`).

URL parameter metadata (no SDK needed): append `?userplane-meta=key1%3Dval1,key2%3Dval2` to recording link. Decoded: `key1=val1,key2=val2`. SDK values take priority over URL values.

Common pattern — set on login, clear on logout:

```javascript
function onLogin(user) {
  set('userId', user.id);
  set('email', user.email);
}
function onLogout() {
  clearMetadata();
}
```

## Sensitive Data Redaction

`data-userplane-blur` attribute — add to any element:

```html
<div data-userplane-blur>Blurred in recordings.</div>
```

Values: `true`, `1`, `yes`, or bare attribute. Exclude child: `data-userplane-blur="false"`.

`.userplane-mask` CSS class — alternative to data attribute.

`<meta>` tag with CSS selectors for centralized rules:

```html
<meta name="userplane:blur" content=".customer-info, #credit-card-form" />
```

Auto-blur: when **Hide sensitive fields** is enabled in domain settings, password and credit card fields are auto-blurred.

Third-party compatibility: auto-detects privacy attributes from FullStory, Hotjar, Sentry, OpenReplay, Heap, Amplitude, rrweb, LogRocket, Clarity, ContentSquare, Quantum Metric, Glassbox, Smartlook, Mouseflow, Inspectlet, Lucky Orange. Also: `[data-private]`, `.private`, `[data-sensitive]`, `.sensitive`.

## Web SDK API

`initialize(options?)` — call once on app load:

| Property          | Type                 | Default           | Description                                                              |
| ----------------- | -------------------- | ----------------- | ------------------------------------------------------------------------ |
| `workspaceId`     | `string \| string[]` | From `<meta>` tag | Workspace ID                                                             |
| `openImmediately` | `boolean \| string`  | `true`            | Auto-open on recording URL params; pass token string to open immediately |
| `captureEnabled`  | `boolean`            | `true`            | Mount background capture iframe                                          |

`open(token?)` — open recorder. Returns `boolean`. Without token, uses URL params.

`unmount()` — close and unmount recorder.

`getRecordingState()` — returns `'inactive'` | `'active'` | `'retained'`.

`isInitialized()` — true if SDK initialized. `isRecorderMounted()` — true if recorder visible. `isBridgeConnected()` — true if bridge to recorder iframe established.

## URL Parameters

Recording links append these query parameters:

| Parameter             | Description                                                 |
| --------------------- | ----------------------------------------------------------- |
| `userplane-token`     | Recording session token (required)                          |
| `userplane-action`    | Action type: `recording`, `verify`, or `capture` (required) |
| `userplane-workspace` | Workspace ID                                                |

Preserve all `userplane-` prefixed params through any redirect:

```javascript
const url = new URL(window.location.href);
const target = new URL('/login', window.location.origin);
for (const [key, value] of url.searchParams) {
  if (key.startsWith('userplane-')) target.searchParams.set(key, value);
}
window.location.href = target.toString();
```
