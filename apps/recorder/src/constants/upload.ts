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

/** Total timeout for video upload across all retries (15 minutes) */
export const VIDEO_UPLOAD_TOTAL_TIMEOUT_MS = 900000;

/** Total timeout for thumbnail upload across all retries (3 minutes) */
export const THUMBNAIL_UPLOAD_TOTAL_TIMEOUT_MS = 180000;

// ===========================================
// Unified Upload Configuration
// ===========================================

export interface UploadConfig {
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  totalTimeout: number;
}

/** Unified video upload configuration */
export const VIDEO_UPLOAD_CONFIG: UploadConfig = {
  timeout: VIDEO_UPLOAD_TIMEOUT_MS,
  maxRetries: VIDEO_UPLOAD_MAX_RETRIES,
  retryDelay: RETRY_BASE_DELAY_MS,
  totalTimeout: VIDEO_UPLOAD_TOTAL_TIMEOUT_MS,
};

/** Unified thumbnail upload configuration */
export const THUMBNAIL_UPLOAD_CONFIG: UploadConfig = {
  timeout: THUMBNAIL_UPLOAD_TIMEOUT_MS,
  maxRetries: THUMBNAIL_UPLOAD_MAX_RETRIES,
  retryDelay: RETRY_BASE_DELAY_MS,
  totalTimeout: THUMBNAIL_UPLOAD_TOTAL_TIMEOUT_MS,
};

/** Log upload timeout in milliseconds (3 minutes) */
export const LOG_UPLOAD_TIMEOUT_MS = 180000;

/** Maximum retry attempts for log upload */
export const LOG_UPLOAD_MAX_RETRIES = 3;

/** Total timeout for log upload across all retries (10 minutes) */
export const LOG_UPLOAD_TOTAL_TIMEOUT_MS = 600000;

/** Unified log upload configuration */
export const LOG_UPLOAD_CONFIG: UploadConfig = {
  timeout: LOG_UPLOAD_TIMEOUT_MS,
  maxRetries: LOG_UPLOAD_MAX_RETRIES,
  retryDelay: RETRY_BASE_DELAY_MS,
  totalTimeout: LOG_UPLOAD_TOTAL_TIMEOUT_MS,
};

// ===========================================
// Progress
// ===========================================

/** Minimum progress update interval in milliseconds */
export const PROGRESS_UPDATE_INTERVAL_MS = 100;
