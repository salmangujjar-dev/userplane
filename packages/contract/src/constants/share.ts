/**
 * Share feature constants
 * Shared between API and dashboard for consistency
 */

/**
 * Share link duration options
 * Used in the dashboard UI and validated by the API
 */
export const SHARE_DURATION_OPTIONS = [
  { label: '1 hour', seconds: 3600 },
  { label: '6 hours', seconds: 21600 },
  { label: '12 hours', seconds: 43200 },
  { label: '1 day', seconds: 86400 },
  { label: '3 days', seconds: 259200 },
  { label: '7 days', seconds: 604800 },
  { label: '14 days', seconds: 1209600 },
] as const;

/**
 * Maximum allowed share duration in seconds (14 days)
 */
export const SHARE_MAX_DURATION_SECONDS = 1209600;

/**
 * Default share duration in seconds (1 day)
 */
export const SHARE_DEFAULT_DURATION_SECONDS = 86400;

/**
 * Valid share duration values in seconds
 */
export const SHARE_DURATION_VALUES = SHARE_DURATION_OPTIONS.map((o) => o.seconds);
