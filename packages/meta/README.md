# @workspace/meta

Shared metadata, branding assets, and SEO configuration for all Userplane apps optimized for Intercom integration.

## Purpose

This package centralizes:

- Site metadata (titles, descriptions, keywords)
- Favicon and branding assets
- SEO and Open Graph configurations
- Consistent meta tags across all apps

## Usage

### Basic Import

```typescript
import { SITE_META, APP_META, getAppMeta, createMeta } from '@workspace/meta';
```

### Get App-Specific Metadata

```typescript
import { getAppMeta } from '@workspace/meta';

const dashMeta = getAppMeta('dash');
```

### Create Custom Metadata

```typescript
import { createMeta } from '@workspace/meta';

const pageMeta = createMeta({
  title: 'Custom Page Title',
  description: 'Custom description for this specific page',
});
```

### Favicon Asset

The favicon is available at:

```
@workspace/meta/assets/favicon.svg
```

For Next.js apps, copy it to your `public` folder or reference it in your layout.
For Astro apps, copy it to your `public` folder or reference it in your layout.

## Structure

```
packages/meta/
├── assets/
│   └── favicon.svg      # Shared favicon
├── src/
│   └── index.ts         # Metadata configurations
├── package.json
└── tsconfig.json
```

## Integration

See `src/index.ts` for line references to metadata configurations used across apps.
