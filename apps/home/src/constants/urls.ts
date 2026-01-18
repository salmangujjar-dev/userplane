/**
 * Base URL configuration
 * Centralizes URL construction for the entire application
 */

/**
 * Get environment variable value
 * Works in both server and client contexts
 */
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // Check if running in browser
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).__ENV__?.[key] || defaultValue;
  }

  // Check if running in Astro/Vite context
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }

  return defaultValue;
};

/**
 * Marketing/Homepage base URL
 * Used for static content, blog, landing pages
 */
export const HOME_URL = getEnvVar('PUBLIC_HOME_URL', 'http://localhost:4321');

/**
 * Dashboard base URL
 * Used for dashboard, authentication, and app pages
 */
export const DASH_URL = getEnvVar('PUBLIC_DASH_URL', 'http://localhost:3000');

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
