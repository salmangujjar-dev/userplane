/**
 * HTTP header constants
 * Centralized header name definitions for consistency across the API
 */

/**
 * Custom request headers
 */
export const REQUEST_HEADERS = {
  SESSION_TOKEN: 'x-userplane-session-token',
  UPLOAD_TOKEN: 'x-userplane-upload-token',
} as const;

/**
 * Custom response headers
 */
export const RESPONSE_HEADERS = {
  SESSION_TOKEN_EXPIRES_IN: 'x-userplane-session-token-expires-in',
  SESSION_TOKEN_EXPIRES_AT: 'x-userplane-session-token-expires-at',
  UPLOAD_TOKEN_EXPIRES_IN: 'x-userplane-upload-token-expires-in',
  UPLOAD_TOKEN_EXPIRES_AT: 'x-userplane-upload-token-expires-at',
  UPLOAD_TOKEN_REMAINING: 'x-userplane-upload-token-remaining',
  PRESIGNED_URL_EXPIRES_IN: 'x-userplane-presigned-url-expires-in',
  EXCLUDED: 'x-userplane-excluded',
} as const;
