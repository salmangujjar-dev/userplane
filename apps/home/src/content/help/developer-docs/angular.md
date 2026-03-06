---
title: 'Angular Integration'
excerpt: 'Install Userplane in an Angular application using APP_INITIALIZER'
order: 12
lastUpdated: 2026-03-07
---

This guide covers how to install Userplane in an Angular application.

## Adding the script

The fastest way to add Userplane is the CDN embed. Add these two tags to the `<head>` of `src/index.html`:

```html
<meta name="userplane:workspace" content="YOUR_WORKSPACE_ID" />
<script type="module" src="https://cdn.userplane.io/embed/script.js"></script>
```

You can copy the snippet with your workspace ID pre-filled from **Workspace Settings > Domains** in the Userplane dashboard.

## npm SDK

Use the npm SDK when you need programmatic control — triggering recordings from a button, attaching user metadata, or reading recording state.

### Installation

```bash
npm install @userplane/sdk
```

### Initialization

Create an initializer factory and register it with `APP_INITIALIZER` in your app config. Angular calls `APP_INITIALIZER` providers during bootstrap, before the first component renders.

```typescript
// src/app/initializers/userplane.initializer.ts
import { initialize } from '@userplane/sdk';
import { environment } from '../../environments/environment';

export function provideUserplane() {
  return () => {
    initialize({ workspaceId: environment.userplaneWorkspaceId });
  };
}
```

```typescript
// src/app/app.config.ts
import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideUserplane } from './initializers/userplane.initializer';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      useFactory: provideUserplane,
      multi: true,
    },
  ],
};
```

Store the workspace ID in your environment file:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  userplaneWorkspaceId: 'ws_abc123',
};
```

```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  userplaneWorkspaceId: 'ws_abc123',
};
```

Angular CLI replaces `environment.ts` with `environment.prod.ts` for production builds automatically.

### URL parameters

When a customer opens a recording link, Userplane appends `userplane-token` and `userplane-action` to the URL. If your app uses route guards that redirect unauthenticated users, preserve the `userplane-` prefixed parameters through the redirect:

```typescript
// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ActivatedRouteSnapshot } from '@angular/router';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (!authService.isAuthenticated()) {
    const queryParams: Record<string, string> = {};

    for (const [key, value] of Object.entries(route.queryParams)) {
      if (key.startsWith('userplane-') && typeof value === 'string') {
        queryParams[key] = value;
      }
    }

    router.navigate(['/login'], { queryParams });
    return false;
  }

  return true;
};
```

See [Setting Up Userplane Scripts](/help/developer-docs/setting-up-userplane-scripts) for the full list of parameters.

## Sensitive data

Add `data-userplane-blur` to any element you want blurred in recordings. See [Sensitive Data Redaction](/help/developer-docs/sensitive-data-redaction) for the full reference.

## Metadata

Call `set()` inside the initializer factory after `initialize()`:

```typescript
// src/app/initializers/userplane.initializer.ts
import { initialize, set } from '@userplane/sdk';
import { environment } from '../../environments/environment';

export function provideUserplane() {
  return () => {
    initialize({ workspaceId: environment.userplaneWorkspaceId });
    set('environment', environment.production ? 'production' : 'development');
  };
}
```

See [Metadata SDK](/help/developer-docs/metadata-sdk) for the full API.

## Example app

A complete Angular example is available at [github.com/wizenheimer/userplane-sdk-examples/tree/main/examples/angular](https://github.com/wizenheimer/userplane-sdk-examples/tree/main/examples/angular).

| Variable                 | Description                                           |
| ------------------------ | ----------------------------------------------------- |
| `USERPLANE_WORKSPACE_ID` | Your Userplane workspace ID (set in `environment.ts`) |

```bash
cd examples/angular && npm install && ng serve
```

## Related articles

- [Setting Up Userplane Scripts](/help/developer-docs/setting-up-userplane-scripts) — CDN script placement, CSP, and redirect handling.
- [Web SDK](/help/developer-docs/web-sdk) — full SDK API reference.
- [Metadata SDK](/help/developer-docs/metadata-sdk) — attach user context to recordings.
- [Sensitive Data Redaction](/help/developer-docs/sensitive-data-redaction) — blur sensitive content in recordings.
