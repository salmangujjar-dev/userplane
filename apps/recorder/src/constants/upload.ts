/**
 * Upload constants
 * Timeouts, retries, and delays for file uploads
 */

// ===========================================
// Timeouts
// ===========================================

/** Video upload timeout in milliseconds (5 minutes) */
export const VIDEO_UPLOAD_TIMEOUT_MS = 300000;

/** Thumbnail upload timeout in milliseconds (1 minute) */
export const THUMBNAIL_UPLOAD_TIMEOUT_MS = 60000;

/** API request timeout in milliseconds (30 seconds) */
export const API_REQUEST_TIMEOUT_MS = 30000;

// ===========================================
// Retry Configuration
// ===========================================

/** Maximum retry attempts for video upload */
export const VIDEO_UPLOAD_MAX_RETRIES = 3;

/** Maximum retry attempts for thumbnail upload */
export const THUMBNAIL_UPLOAD_MAX_RETRIES = 2;

/** Maximum retry attempts for API requests */
export const API_REQUEST_MAX_RETRIES = 3;

/** Base delay for exponential backoff in milliseconds */
export const RETRY_BASE_DELAY_MS = 1000;

/** Maximum delay between retries in milliseconds (30 seconds) */
export const RETRY_MAX_DELAY_MS = 30000;

// ===========================================
// Progress
// ===========================================

/** Minimum progress update interval in milliseconds */
export const PROGRESS_UPDATE_INTERVAL_MS = 100;
