/**
 * Base URL configuration
 * Centralizes URL construction for the entire application
 */

import { env } from '@/lib/env';

/**
 * Marketing/Homepage base URL
 * Used for static content, blog, landing pages
 */
export const HOME_URL = env.homeUrl;

/**
 * Dashboard base URL
 * Used for dashboard, authentication, and app pages
 */
export const DASH_URL = env.dashUrl;

/**
 * Helper to construct full URL for marketing pages
 */
export const getMarketingUrl = (path: string): string => {
  return `${HOME_URL}${path}`;
};

/**
 * Helper to construct full URL for dashboard and app pages
 */
export const getDashUrl = (path: string): string => {
  return `${DASH_URL}${path}`;
};
