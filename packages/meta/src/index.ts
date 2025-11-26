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
    "Request screen recording with console logs, network data and user steps showing exactly what went wrong. See the issue through your customer's lens",
  keywords:
    'screen recording for support teams, request customer screen recording, remote screen support tool, userplane, userplane screen recording, userplane customer support, capture network logs, error traces recording, customer screen capture, screen recording tool, support team tools, customer issue tracking, bug reproduction, console logs capture',
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
    description: 'Manage your screen recordings and support requests',
  },
  recorder: {
    ...SITE_META,
    title: 'Recorder - Userplane',
    description: 'Record your screen with console logs and network data',
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
