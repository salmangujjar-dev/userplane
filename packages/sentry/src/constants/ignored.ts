/**
 * Ignored errors configuration for Sentry
 * Centralized definitions for errors that should not be reported
 */

/**
 * Common ignored errors for API/server applications
 * These are expected errors that don't indicate bugs
 */
export const IGNORED_ERRORS_API = ['RATE_LIMIT_EXCEEDED', 'Unauthorized', 'UNAUTHORIZED'] as const;

/**
 * Common ignored errors for Next.js server-side rendering
 */
export const IGNORED_ERRORS_SERVER = ['UNAUTHORIZED', 'Unauthorized'] as const;

/**
 * Browser-specific ignored errors for client-side applications
 * These are noise from browser quirks or expected behavior
 */
export const IGNORED_ERRORS_BROWSER = [
  // ResizeObserver errors from browser quirks - safe to ignore
  'ResizeObserver loop limit exceeded',
  'ResizeObserver loop completed with undelivered notifications',
  // Generic promise rejection without actual error
  'Non-Error promise rejection captured',
] as const;

/**
 * Combined ignored errors for full-stack applications (like Next.js)
 */
export const IGNORED_ERRORS_FULLSTACK = [
  ...IGNORED_ERRORS_SERVER,
  ...IGNORED_ERRORS_BROWSER,
] as const;
