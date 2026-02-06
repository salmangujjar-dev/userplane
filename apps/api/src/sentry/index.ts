/**
 * Sentry utilities for API
 * Re-exports all Sentry-related functionality for the API app
 */

export { initSentry } from './init';
export {
  enrichSentryFullContext,
  enrichSentryUserContext,
  enrichSentryWorkspaceContext,
} from './middleware';

// Re-export shared utilities for convenience
export {
  buildErrorTags,
  buildRecordingTags,
  buildTaskTags,
  buildWebhookTags,
  buildWorkspaceTags,
  createDbBreadcrumb,
  ErrorSources,
  ErrorTypes,
  TagNames,
} from '@workspace/sentry';
