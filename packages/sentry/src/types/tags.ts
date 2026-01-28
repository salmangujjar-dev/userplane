/**
 * Standardized Sentry tag names
 * Use these constants to ensure consistent tag naming across all apps
 */

/**
 * Standard tag names for Sentry events
 */
export const TagNames = {
  // Error classification
  ERROR_TYPE: 'error_type',
  ERROR_SOURCE: 'error_source',
  ERROR_BOUNDARY: 'error_boundary',

  // User context
  USER_ID: 'user_id',

  // Workspace context
  WORKSPACE_ID: 'workspace_id',
  WORKSPACE_ROLE: 'workspace_role',

  // Recording context
  SESSION_ID: 'session_id',
  RECORDING_ID: 'recording_id',
  RECORDING_STAGE: 'recording_stage',
  UPLOAD_STATUS: 'upload_status',

  // Task context (Trigger.dev)
  TASK_ID: 'task_id',
  RUN_ID: 'run_id',

  // Webhook context
  WEBHOOK_TYPE: 'webhook_type',
  EVENT_TYPE: 'event_type',

  // React Query context
  OPERATION_TYPE: 'operation_type',

  // Client error context
  CLIENT_ERROR_CODE: 'client_error_code',
} as const;

export type TagName = (typeof TagNames)[keyof typeof TagNames];

/**
 * Error types for classification in Sentry
 */
export const ErrorTypes = {
  // API errors
  API_UNKNOWN_ERROR: 'api_unknown_error',
  UNKNOWN_ERROR: 'unknown_error',

  // Recording errors
  RECORDING_ERROR: 'recording_error',
  RECORDING_START_FAILED: 'recording_start_failed',
  RECORDING_STOP_FAILED: 'recording_stop_failed',

  // Upload errors
  VIDEO_UPLOAD_FAILED: 'video_upload_failed',
  THUMBNAIL_UPLOAD_FAILURE: 'thumbnail_upload_failure',

  // Browser errors
  CRITICAL_BROWSER_ERROR: 'critical_browser_error',
} as const;

export type ErrorType = (typeof ErrorTypes)[keyof typeof ErrorTypes];

/**
 * Error sources for tracing where errors originate
 */
export const ErrorSources = {
  REACT_QUERY: 'react_query',
  RECORDING_FLOW: 'recording_flow',
  RECORDING_SESSION: 'recording_session',
} as const;

export type ErrorSource = (typeof ErrorSources)[keyof typeof ErrorSources];
