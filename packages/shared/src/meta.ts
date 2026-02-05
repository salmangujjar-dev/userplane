/**
 * Shared metadata configuration for all apps
 * Provides consistent branding, SEO, and meta tags across the workspace
 */

import type { MediaClient } from './media';

/**
 * Site metadata interface
 */
export interface SiteMeta {
  title: string;
  description: string;
  keywords: string;
  locale: string;
  favicon: string;
  ogImage: string;
}

/**
 * Brand URLs from CDN
 */
export interface MetaUrls {
  favicon: string;
  logoDark: string;
  logoLight: string;
}

/**
 * Default site metadata for Userplane
 * Individual apps can override specific fields as needed
 */
export const SITE_META: SiteMeta = {
  title: 'Userplane - One Click Screen Recordings for Intercom',
  description:
    "Request screen recordings directly in Intercom with console logs, network data and user steps showing exactly what went wrong. See the issue through your customer's lens",
  keywords:
    'intercom screen recording, intercom integration, screen recording for intercom, request customer screen recording, intercom support tool, userplane, userplane intercom, intercom customer support, capture network logs, error traces recording, intercom screen capture, intercom app, intercom messenger, support team tools, customer issue tracking, bug reproduction, console logs capture',
  locale: 'en_US',
  favicon: '/favicon.svg',
  ogImage: '/images/preview/preview.webp',
};

/**
 * App-specific metadata configurations
 * Each app can have its own metadata while maintaining consistency
 */
export const APP_META = {
  home: {
    ...SITE_META,
  },
  dash: {
    ...SITE_META,
    title: 'Dashboard - Userplane',
  },
  recorder: {
    ...SITE_META,
    title: 'Recorder - Userplane',
  },
} as const;

/**
 * Helper to get meta tags for a specific app
 */
export function getAppMeta(app: keyof typeof APP_META): SiteMeta {
  return APP_META[app];
}

/**
 * Helper to create custom meta by merging with defaults
 */
export function createMeta(overrides: Partial<SiteMeta>): SiteMeta {
  return {
    ...SITE_META,
    ...overrides,
  };
}

/**
 * Get brand URLs (favicon, logos) from a media client
 * Use this to get CDN URLs for brand assets
 *
 * @param client - MediaClient instance configured with CDN domain
 * @returns MetaUrls with favicon, logoDark, and logoLight URLs
 *
 * @example
 * ```typescript
 * import { mediaClient } from '@/lib/media';
 * import { getMetaUrls } from '@workspace/shared/meta';
 *
 * const urls = getMetaUrls(mediaClient);
 * // urls.favicon = 'https://cdn.userplane.io/media/brand/favicon.xxx.svg'
 * ```
 */
export function getMetaUrls(client: MediaClient): MetaUrls {
  return {
    favicon: client.brand.favicon(),
    logoDark: client.brand.logo('dark'),
    logoLight: client.brand.logo('light'),
  };
}
