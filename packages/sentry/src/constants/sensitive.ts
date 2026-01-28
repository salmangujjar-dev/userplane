/**
 * Sensitive data patterns for filtering from Sentry events
 * Centralized definitions to ensure consistent PII/credential filtering
 */

/**
 * HTTP headers that should be filtered from Sentry events
 * These typically contain authentication credentials or session tokens
 */
export const SENSITIVE_HEADERS = [
  'authorization',
  'cookie',
  'x-userplane-session-token',
  'x-userplane-upload-token',
] as const;

export type SensitiveHeader = (typeof SENSITIVE_HEADERS)[number];

/**
 * Cookie name patterns that indicate sensitive data
 * Used for partial matching (includes)
 */
export const SENSITIVE_COOKIE_PATTERNS = ['session_token', 'auth'] as const;

/**
 * Extra/context key patterns that indicate sensitive data
 * Used for partial matching (includes, case-insensitive)
 */
export const SENSITIVE_EXTRA_PATTERNS = ['token', 'sessionToken', 'presignedUrl', 'url'] as const;

/**
 * Regex patterns for sensitive data in message strings
 */
export const SENSITIVE_REGEX_PATTERNS = {
  /**
   * JWT token pattern (eyJ.....)
   */
  JWT: /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*/g,

  /**
   * AWS presigned URL pattern (contains X-Amz- params or Signature=)
   */
  PRESIGNED_URL: /https?:\/\/[^\s]*\?(.*?X-Amz-[^&\s]*|.*?Signature=[^&\s]*)[^\s]*/gi,
} as const;

/**
 * Replacement strings for filtered content
 */
export const FILTER_REPLACEMENTS = {
  HEADER: '[Filtered]',
  JWT: '[JWT Filtered]',
  PRESIGNED_URL: '[Presigned URL Filtered]',
} as const;
