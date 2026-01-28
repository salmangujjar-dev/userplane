/**
 * Tag builder utilities for Sentry
 * Provides type-safe tag creation with consistent naming
 */

import { ErrorSources, ErrorTypes, TagNames } from '../types/tags.js';

/**
 * Build standardized error tags for Sentry.captureException
 *
 * @example
 * ```ts
 * Sentry.captureException(error, {
 *   tags: buildErrorTags({
 *     errorType: ErrorTypes.API_UNKNOWN_ERROR,
 *     errorSource: ErrorSources.REACT_QUERY,
 *   }),
 * });
 * ```
 */
export function buildErrorTags(options: {
  errorType?: string;
  errorSource?: string;
  errorBoundary?: string;
}): Record<string, string> {
  const tags: Record<string, string> = {};

  if (options.errorType) {
    tags[TagNames.ERROR_TYPE] = options.errorType;
  }
  if (options.errorSource) {
    tags[TagNames.ERROR_SOURCE] = options.errorSource;
  }
  if (options.errorBoundary) {
    tags[TagNames.ERROR_BOUNDARY] = options.errorBoundary;
  }

  return tags;
}

/**
 * Build workspace-related tags for Sentry
 *
 * @example
 * ```ts
 * Sentry.setTags(buildWorkspaceTags({
 *   workspaceId: 'ws_123',
 *   workspaceRole: 'admin',
 * }));
 * ```
 */
export function buildWorkspaceTags(options: {
  workspaceId?: string;
  workspaceRole?: string;
  userId?: string;
}): Record<string, string> {
  const tags: Record<string, string> = {};

  if (options.workspaceId) {
    tags[TagNames.WORKSPACE_ID] = options.workspaceId;
  }
  if (options.workspaceRole) {
    tags[TagNames.WORKSPACE_ROLE] = options.workspaceRole;
  }
  if (options.userId) {
    tags[TagNames.USER_ID] = options.userId;
  }

  return tags;
}

/**
 * Build recording-related tags for Sentry
 *
 * @example
 * ```ts
 * Sentry.captureException(error, {
 *   tags: buildRecordingTags({
 *     sessionId: 'sess_123',
 *     recordingId: 'rec_456',
 *     stage: 'upload',
 *   }),
 * });
 * ```
 */
export function buildRecordingTags(options: {
  sessionId?: string;
  recordingId?: string;
  stage?: string;
  uploadStatus?: string;
}): Record<string, string> {
  const tags: Record<string, string> = {};

  if (options.sessionId) {
    tags[TagNames.SESSION_ID] = options.sessionId;
  }
  if (options.recordingId) {
    tags[TagNames.RECORDING_ID] = options.recordingId;
  }
  if (options.stage) {
    tags[TagNames.RECORDING_STAGE] = options.stage;
  }
  if (options.uploadStatus) {
    tags[TagNames.UPLOAD_STATUS] = options.uploadStatus;
  }

  return tags;
}

/**
 * Build task-related tags for Sentry (Trigger.dev)
 *
 * @example
 * ```ts
 * Sentry.captureException(error, {
 *   tags: buildTaskTags({
 *     taskId: 'task_123',
 *     runId: 'run_456',
 *   }),
 * });
 * ```
 */
export function buildTaskTags(options: {
  taskId?: string;
  runId?: string;
}): Record<string, string> {
  const tags: Record<string, string> = {};

  if (options.taskId) {
    tags[TagNames.TASK_ID] = options.taskId;
  }
  if (options.runId) {
    tags[TagNames.RUN_ID] = options.runId;
  }

  return tags;
}

/**
 * Build webhook-related tags for Sentry
 *
 * @example
 * ```ts
 * Sentry.captureException(error, {
 *   tags: buildWebhookTags({
 *     webhookType: 'subscription',
 *     eventType: 'subscription.created',
 *   }),
 * });
 * ```
 */
export function buildWebhookTags(options: {
  webhookType?: string;
  eventType?: string;
}): Record<string, string> {
  const tags: Record<string, string> = {};

  if (options.webhookType) {
    tags[TagNames.WEBHOOK_TYPE] = options.webhookType;
  }
  if (options.eventType) {
    tags[TagNames.EVENT_TYPE] = options.eventType;
  }

  return tags;
}

/**
 * Build React Query operation tags for Sentry
 *
 * @example
 * ```ts
 * Sentry.captureException(error, {
 *   tags: buildReactQueryTags({
 *     operationType: 'mutation',
 *     errorSource: ErrorSources.REACT_QUERY,
 *   }),
 * });
 * ```
 */
export function buildReactQueryTags(options: {
  operationType: 'query' | 'mutation';
  errorSource?: string;
}): Record<string, string> {
  return {
    [TagNames.ERROR_SOURCE]: options.errorSource ?? ErrorSources.REACT_QUERY,
    [TagNames.OPERATION_TYPE]: options.operationType,
  };
}

/**
 * Build client error tags for browser errors
 *
 * @example
 * ```ts
 * Sentry.captureException(error, {
 *   tags: buildClientErrorTags({
 *     errorType: ErrorTypes.CRITICAL_BROWSER_ERROR,
 *     clientErrorCode: 'CLIENT_BROWSER_UNSUPPORTED',
 *   }),
 * });
 * ```
 */
export function buildClientErrorTags(options: {
  errorType?: string;
  clientErrorCode?: string;
}): Record<string, string> {
  const tags: Record<string, string> = {};

  if (options.errorType) {
    tags[TagNames.ERROR_TYPE] = options.errorType;
  }
  if (options.clientErrorCode) {
    tags[TagNames.CLIENT_ERROR_CODE] = options.clientErrorCode;
  }

  return tags;
}

// Re-export for convenience
export { ErrorSources, ErrorTypes, TagNames };
