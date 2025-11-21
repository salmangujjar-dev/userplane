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
export const BASE_URL = getEnvVar('PUBLIC_BASE_URL', '');

/**
 * App/Dashboard base URL
 * Used for signup, onboarding, dashboard, and app features
 */
export const APP_URL = getEnvVar('PUBLIC_APP_URL', '');

/**
 * Helper to construct full URL for marketing pages
 */
export const getMarketingUrl = (path: string): string => {
  return `${BASE_URL}${path}`;
};

/**
 * Helper to construct full URL for app pages
 */
export const getAppUrl = (path: string): string => {
  return `${APP_URL}${path}`;
};
