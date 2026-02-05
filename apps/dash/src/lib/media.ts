/**
 * Media client for dash app
 * Provides access to CDN media assets (logos, favicons, etc.)
 */

import { createMediaClient, DEFAULT_CDN_DOMAIN } from '@workspace/shared/media';

const cdnDomain = process.env.NEXT_PUBLIC_CDN_DOMAIN || DEFAULT_CDN_DOMAIN;

export const mediaClient = createMediaClient({ cdnDomain });
