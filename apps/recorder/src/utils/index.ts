/**
 * Utils barrel export
 * Re-exports all utility functions for convenient imports
 */

// Browser detection utilities
export {
  type AppMode,
  type BrowserInfo,
  captureSystemMetadata,
  detectAppMode,
  detectBrowser,
  detectOS,
  getBestMimeType,
  getSupportedMimeTypes,
  isEmbedded,
  isScreenRecordingSupported,
  isStandalone,
  isSystemAudioSupported,
  type OSInfo,
  type SystemMetadata,
} from './browser';

// Upload utilities
export {
  calculateTotalProgress,
  type UploadOptions,
  type UploadProgress,
  type UploadResult,
  uploadToObjectStore,
} from './upload';

// JWT utilities
export { decodeJwtPayload, getJwtTimeToExpiry, isJwtExpired } from './jwt';

// Video utilities
export { blobToDataUrl, generateVideoThumbnail } from './video-thumbnail';

// Color utilities
export { darkenColor, lightenColor } from './color';

// Retry utilities
export {
  type RetryOptions,
  retryPredicates,
  sleep,
  type TimeoutOptions,
  withRetry,
  withTimeout,
} from './retry';

// URL utilities
export { getUrlParams, parseWorkspaceIds } from './url';
