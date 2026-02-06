/**
 * Standardized Sentry context shapes
 * Use these interfaces to ensure consistent context structure across all apps
 *
 * Note: Sentry's setContext expects Record<string, unknown>, so these interfaces
 * are guides for consistency but should be cast or spread when used with Sentry APIs.
 */

/**
 * Context for workspace-related events
 */
export interface WorkspaceContext {
  workspace_id: string;
  workspace_role?: string;
  workspace_member_id?: string;
  [key: string]: unknown;
}

/**
 * Context for recording-related events
 */
export interface RecordingContext {
  session_id?: string;
  recording_id?: string;
  stage?: 'initialization' | 'upload' | 'processing' | 'completion';
  upload_status?: string;
  [key: string]: unknown;
}

/**
 * Context for background task events (Inngest)
 */
export interface BackgroundTaskContext {
  taskId: string;
  runId: string;
  attemptNumber: number;
  [key: string]: unknown;
}

/**
 * @deprecated Use BackgroundTaskContext instead
 */
export type TriggerTaskContext = BackgroundTaskContext;

/**
 * Context for webhook events
 */
export interface WebhookContext {
  webhookId: string;
  eventType: string;
  timestamp?: string;
  [key: string]: unknown;
}

/**
 * Context for React/error boundary errors
 */
export interface ReactErrorContext {
  digest?: string;
  componentStack?: string;
  [key: string]: unknown;
}

/**
 * Context for React Query operations
 */
export interface ReactQueryContext {
  type: 'query' | 'mutation';
  error_type: string;
  variables?: string;
  [key: string]: unknown;
}

/**
 * Context for database query breadcrumbs
 */
export interface DbQueryContext {
  operation: 'select' | 'insert' | 'update' | 'delete';
  table?: string;
  recording_id?: string;
  workspace_id?: string;
  project_id?: string;
  status_group?: string;
  new_status?: string;
  [key: string]: unknown;
}

/**
 * Context for upload operations
 */
export interface UploadContext {
  file_type: 'video' | 'thumbnail' | 'console_log' | 'network_log' | 'action';
  file_size?: number;
  file_mime_type?: string;
  recording_id?: string;
  session_id?: string;
  total_size?: number;
  progress_before_failure?: number;
  [key: string]: unknown;
}

/**
 * Context for flow state transitions
 */
export interface FlowTransitionContext {
  previous_state: string;
  new_state: string;
  timestamp: number;
  session_id?: string;
  workspace_id?: string;
  link_id?: string;
  recording_mode?: string;
  recording_duration_ms?: number;
  blob_size_bytes?: number;
  has_thumbnail?: boolean;
  [key: string]: unknown;
}
