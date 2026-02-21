/**
 * Base URL configuration
 * Centralizes URL construction for the entire application
 */

import { env } from '@/env';

/**
 * Helper to construct full URL for marketing pages
 */
export const getMarketingUrl = (path: string): string => {
  return `${env.home.url}${path}`;
};

/**
 * Helper to construct full URL for dashboard and app pages
 */
export const getDashUrl = (path: string): string => {
  return `${env.dashboard.url}${path}`;
};
