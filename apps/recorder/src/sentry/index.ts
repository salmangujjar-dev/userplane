/**
 * Sentry utilities for recorder app
 * Re-exports all Sentry-related functionality for the recorder app
 */

export {
  ClientError,
  ClientErrors,
  createClientError,
  createClientErrorWithMessage,
  getClientError,
} from './client-errors';
export {
  captureRecordingError,
  createRecordingSpan,
  type RecordingContext,
  setRecordingContext,
} from './recording';

// Re-export shared utilities for convenience
export {
  buildClientErrorTags,
  buildErrorTags,
  buildRecordingTags,
  createApiBreadcrumb,
  createFlowBreadcrumb,
  createSystemBreadcrumb,
  createUploadBreadcrumb,
  ErrorSources,
  ErrorTypes,
  TagNames,
} from '@workspace/sentry';
