# Userplane Media Assets

This directory contains the centralized source of truth for all Userplane media assets.

## Directory Structure

```
assets/
├── brand/           # Logo and favicon SVGs
│   ├── logo-dark.svg
│   ├── logo-light.svg
│   └── favicon.svg
├── tiles/           # Tile illustrations (12 PNGs)
├── integrations/    # Integration logos (27 WebPs)
├── auth/            # Auth provider icons (12 PNGs)
├── intercom-canvas/ # Intercom canvas images (7 PNGs)
└── README.md
```

## Asset Categories

### Brand (`brand/`)

Logo and favicon files used across all apps.

- `logo-dark.svg` - Dark logo (black background, white icon) - Use on light backgrounds
- `logo-light.svg` - Light logo (white background, black icon) - Use on dark backgrounds
- `favicon.svg` - Favicon (updated to match new logo design)

### Tiles (`tiles/`)

Decorative tile illustrations used in dash and recorder apps.

### Integrations (`integrations/`)

Integration provider logos in WebP format used in dash and home apps.

### Auth (`auth/`)

Auth provider icons in PNG format used in dash for OAuth flows.

### Intercom Canvas (`intercom-canvas/`)

Images used in Intercom canvas components. Structure:

- `userplane-icon.png` - Logo for branding headers
- `intercom/request-recording.png` - Request recording icon
- `intercom/view-recordings.png` - View recordings icon
- `intercom/success.png` - Success checkmark icon
- `intercom/error.png` - Error icon
- `intercom/lock.png` - Lock icon for access requests
- `intercom/upgrade.png` - Upgrade icon

## Usage

### TypeScript Imports

Use the media module for type-safe access to CDN asset URLs:

```typescript
import {
  brandUrls,
  tileUrls,
  integrationUrls,
  authUrls,
  intercomCanvasUrls,
  getIntegrationAssets,
} from '@workspace/shared/media';

// Get CDN URLs with content-hash for cache busting
const darkLogo = brandUrls.logo('dark');
// → 'https://cdn.userplane.io/media/brand/logo-dark.a1b2c3d4.svg'

const tileUrl = tileUrls.get('bubble');
// → 'https://cdn.userplane.io/media/tiles/bubble.e5f6g7h8.png'

// Get all integration assets with metadata
const integrations = getIntegrationAssets();
// [{ name: 'asana', label: 'Asana', alt: 'Asana Logo', path: '/integrations/asana.webp' }, ...]

// Intercom canvas images (served from CDN)
const canvasImages = intercomCanvasUrls.all();
// { logo: 'https://cdn.userplane.io/media/...', ... }
```

### Uploading Assets to CDN

Assets are uploaded to R2 CDN with content-hash filenames for cache busting:

```bash
# From packages/shared directory
bun run upload-assets              # Upload all assets
bun run upload-assets --dry-run    # Preview what would be uploaded
bun run upload-assets --force      # Re-upload all assets
bun run upload-assets --verbose    # Show detailed output
```

Or from the monorepo root:

```bash
bun run --filter @workspace/shared upload-assets
```

### R2 Path Structure

Assets are uploaded with content-hash filenames:

```
media/
├── brand/
│   ├── logo-dark.a1b2c3d4.svg
│   ├── logo-light.e5f6g7h8.svg
│   └── favicon.i9j0k1l2.svg
├── tiles/
│   └── bubble.m3n4o5p6.png
├── integrations/
│   └── asana.q7r8s9t0.webp
├── auth/
│   └── intercom.u1v2w3x4.png
└── intercom-canvas/
    ├── userplane-icon.a1b2c3d4.png
    └── intercom/
        └── success.e5f6g7h8.png
```

## Environment Variables

### Upload Script

```bash
R2_CDN_ACCOUNT_ID=xxx
R2_CDN_ACCESS_KEY_ID=xxx
R2_CDN_SECRET_ACCESS_KEY=xxx
R2_CDN_BUCKET_NAME=xxx
```

### Apps

```bash
# CDN configuration (with defaults)
CDN_DOMAIN=https://cdn.userplane.io
R2_CDN_PREFIX=media
```

## Updating Assets

1. **Update source files** in this directory
2. **Run upload script** to upload to R2 CDN:
   ```bash
   bun run --filter @workspace/shared upload-assets
   ```
3. **Commit the source files** and the generated `manifest.generated.ts`

The manifest file maps original asset paths to their hashed CDN paths, enabling cache busting when assets change.

## Logo Specifications

- Format: SVG
- Size: 144x144px
- Style: Rounded rectangle (rx=40) with icon
- Background: Black or white depending on variant
- Icon: White or black path (inverse of background)
