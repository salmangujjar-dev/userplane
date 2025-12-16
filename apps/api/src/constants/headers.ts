/**
 * HTTP header constants
 * Centralized header name definitions for consistency across the API
 */

/**
 * Custom request headers
 */
export const REQUEST_HEADERS = {
  SESSION_TOKEN: 'x-session-token',
  UPLOAD_TOKEN: 'x-upload-token',
  DEBUG: 'x-debug',
} as const;

/**
 * Custom response headers
 */
export const RESPONSE_HEADERS = {
  SESSION_TOKEN_EXPIRES_IN: 'x-session-token-expires-in',
  SESSION_TOKEN_EXPIRES_AT: 'x-session-token-expires-at',
  UPLOAD_TOKEN_EXPIRES_IN: 'x-upload-token-expires-in',
  UPLOAD_TOKEN_EXPIRES_AT: 'x-upload-token-expires-at',
  UPLOAD_TOKEN_REMAINING: 'x-upload-token-remaining',
  PRESIGNED_URL_EXPIRES_IN: 'x-presigned-url-expires-in',
  EXCLUDED: 'x-excluded',
} as const;
