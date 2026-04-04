/**
 * Shared metadata configuration for all apps
 * Provides consistent branding, SEO, and meta tags across the workspace
 */

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
 * Default site metadata for Userplane
 * Individual apps can override specific fields as needed
 */
export const SITE_META: SiteMeta = {
  title: 'Userplane - One Click Screen Recordings for Customer Support',
  description:
    'Request screen recordings from your customers with console logs, network data, and user steps showing exactly what went wrong. Works with Intercom, Zendesk, Slack, and more.',
  keywords:
    'screen recording, customer support screen recording, request screen recording, customer issue tracking, bug reproduction, console logs capture, network data recording, userplane, intercom integration, zendesk integration, slack integration, support team tools',
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
