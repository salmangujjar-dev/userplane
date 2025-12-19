/**
 * Session and upload validation constants
 * Shared across API and client packages
 */

/**
 * Recording duration limits in milliseconds
 */
export const RECORDING_DURATION_LIMITS = {
  /** Default maximum recording duration (3 minutes) */
  DEFAULT_MAX_DURATION_MS: 180000,
  /** Minimum recording duration (1 second) */
  MIN_DURATION_MS: 1000,
} as const;

/**
 * File size limits in bytes
 */
export const FILE_SIZE_LIMITS = {
  MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB
  MAX_VIDEO_SIZE: 500 * 1024 * 1024, // 500MB
  MAX_THUMBNAIL_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_LOG_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_LOGO_SIZE: 4 * 1024 * 1024, // 4MB
} as const;

/**
 * Supported video MIME types
 *
 * Ordered by compression efficiency and quality for optimal MediaRecorder selection.
 * Used by both recorder (for codec selection) and API (for upload validation).
 *
 * Priority order:
 * 1. AV1 - Best compression, newest codec (Chrome 100+, Firefox 113+)
 * 2. VP9 - Excellent compression, widely supported
 * 3. H.264 - Hardware acceleration, good compatibility
 * 4. VP8 - Older but universal WebM support
 * 5. Additional variants and generic containers as fallback
 */
export const VIDEO_MIME_TYPES = [
  // AV1 codec (best compression, ~30% better than VP9)
  'video/webm;codecs=av1,opus',
  'video/webm;codecs=av1',
  'video/mp4;codecs=av01.0.04M.08',

  // VP9 codec (excellent compression)
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp9.0,opus',
  'video/webm;codecs=vp9,pcm',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp9.0',

  // H.264 codec (hardware acceleration, Safari support)
  'video/webm;codecs=h264,opus',
  'video/webm;codecs=avc1,opus',
  'video/webm;codecs=h264',
  'video/webm;codecs=avc1',
  'video/mp4;codecs=h264,aac',
  'video/mp4;codecs=h264',
  'video/mp4;codecs=avc1',
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2', // Baseline
  'video/mp4;codecs=avc1.4D401F,mp4a.40.2', // Main
  'video/mp4;codecs=avc1.64001F,mp4a.40.2', // High

  // VP8 codec (good compatibility)
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=vp8.0,opus',
  'video/webm;codecs=vp8,pcm',
  'video/webm;codecs=vp8,vp9,opus',
  'video/webm;codecs=vp8',
  'video/webm;codecs=vp8.0',

  // Additional container formats
  'video/x-matroska',
  'video/x-matroska;codecs=avc1',
  'video/ogg',

  // Generic containers (last resort)
  'video/webm',
  'video/mp4',
] as const;

/**
 * Allowed MIME types for thumbnail images
 */
export const ALLOWED_THUMBNAIL_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

/**
 * Allowed MIME types for console log files
 */
export const ALLOWED_CONSOLE_LOG_TYPES = ['application/x-ndjson', 'application/ndjson'] as const;

/**
 * Allowed MIME types for network log files
 */
export const ALLOWED_NETWORK_LOG_TYPES = ['application/json'] as const;

/**
 * Base container formats for flexible video validation
 */
export const ALLOWED_VIDEO_CONTAINERS = [
  'video/webm',
  'video/mp4',
  'video/x-matroska',
  'video/ogg',
] as const;

/**
 * Complete session constants
 * Combines duration limits, file size limits, and allowed MIME types
 */
export const SESSION_CONSTANTS = {
  ...RECORDING_DURATION_LIMITS,
  ...FILE_SIZE_LIMITS,
  VIDEO_MIME_TYPES,
  ALLOWED_THUMBNAIL_TYPES,
  ALLOWED_CONSOLE_LOG_TYPES,
  ALLOWED_NETWORK_LOG_TYPES,
  ALLOWED_VIDEO_CONTAINERS,
} as const;
