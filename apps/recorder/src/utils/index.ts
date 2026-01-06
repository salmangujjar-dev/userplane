/**
 * Utils barrel export
 * Re-exports all utility functions for convenient imports
 */

// Browser detection utilities
export {
  detectBrowser,
  detectOS,
  captureSystemMetadata,
  isScreenRecordingSupported,
  isSystemAudioSupported,
  getSupportedMimeTypes,
  getBestMimeType,
  type BrowserInfo,
  type OSInfo,
  type SystemMetadata,
} from './browser';

// Upload utilities
export {
  uploadToObjectStore,
  calculateTotalProgress,
  type UploadProgress,
  type UploadOptions,
  type UploadResult,
} from './upload';

// JWT utilities
export { decodeJwtPayload, isJwtExpired, getJwtTimeToExpiry } from './jwt';

// Video utilities
export { generateVideoThumbnail, blobToDataUrl } from './video-thumbnail';

// Color utilities
export { lightenColor, darkenColor } from './color';

// Retry utilities
export {
  withRetry,
  withTimeout,
  sleep,
  retryPredicates,
  type RetryOptions,
  type TimeoutOptions,
} from './retry';

// URL utilities
export { getUrlParams, parseWorkspaceIds } from './url';
