/**
 * Recording constants
 * Limits and defaults for recording duration, size, and media settings
 */

// ===========================================
// Duration Limits
// ===========================================

/** Default max recording duration in milliseconds (3 minutes) */
export const DEFAULT_MAX_RECORDING_DURATION_MS = 180000;

/** Minimum recording duration in milliseconds (1 second) */
export const MIN_RECORDING_DURATION_MS = 1000;

// ===========================================
// Size Limits
// ===========================================

/** Maximum video file size in bytes (500MB) */
export const MAX_VIDEO_FILE_SIZE_BYTES = 500 * 1024 * 1024;

/** Maximum thumbnail file size in bytes (10MB) */
export const MAX_THUMBNAIL_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Bytes in a megabyte (for display calculations) */
export const BYTES_PER_MB = 1024 * 1024;

// ===========================================
// Media Settings
// ===========================================

/** Video bitrate in bits per second (2.5 Mbps) */
export const VIDEO_BITRATE_BPS = 2500000;

/** Audio sample rate in Hz */
export const AUDIO_SAMPLE_RATE_HZ = 44100;

/** MediaRecorder timeslice in milliseconds (chunk interval) */
export const MEDIA_RECORDER_TIMESLICE_MS = 1000;

// ===========================================
// Thumbnail Generation
// ===========================================

/** Default seek time for thumbnail capture (seconds) */
export const THUMBNAIL_SEEK_TIME_SECONDS = 1;

/** Thumbnail seek percentage of video duration (10%) */
export const THUMBNAIL_SEEK_PERCENTAGE = 0.1;

/** Thumbnail image quality (0-1) */
export const THUMBNAIL_QUALITY = 0.85;

/** Thumbnail output format */
export const THUMBNAIL_FORMAT = 'image/webp';
