# Userplane Brand Assets

This directory contains the source brand assets for Userplane.

## Logo Files

- `logo-dark.svg` - Dark logo (black background, white icon) - Use on light backgrounds
- `logo-light.svg` - Light logo (white background, black icon) - Use on dark backgrounds
- `favicon.svg` - Favicon (updated to match new logo design)

## Usage

These are the **source files**. Each web app (dash, home, recorder, share) has copies in their `public/` folders for serving at runtime.

To update logos across all apps:

1. Update the source files here
2. Copy to each app's public folder:
   ```bash
   cp packages/meta/assets/logo-*.svg apps/dash/public/
   cp packages/meta/assets/logo-*.svg apps/home/public/
   cp packages/meta/assets/logo-*.svg apps/recorder/public/
   cp packages/meta/assets/logo-*.svg apps/share/public/
   ```

## Logo Specifications

- Format: SVG
- Size: 144x144px
- Style: Rounded rectangle (rx=40) with icon
- Background: Black or white depending on variant
- Icon: White or black path (inverse of background)
