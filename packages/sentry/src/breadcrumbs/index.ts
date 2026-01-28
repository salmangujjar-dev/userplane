/**
 * Breadcrumb builder utilities for Sentry
 * Provides consistent breadcrumb creation across all apps
 */

import type { DbQueryContext, FlowTransitionContext } from '../types/contexts.js';

/**
 * Breadcrumb severity levels
 */
export type BreadcrumbLevel = 'debug' | 'info' | 'warning' | 'error';

/**
 * Breadcrumb structure (Sentry-compatible)
 */
export interface Breadcrumb {
  category: string;
  message: string;
  level: BreadcrumbLevel;
  data?: Record<string, unknown>;
}

/**
 * Create a database query breadcrumb
 *
 * @example
 * ```ts
 * Sentry.addBreadcrumb(createDbBreadcrumb({
 *   message: 'Query recording by ID',
 *   operation: 'select',
 *   recording_id: recordingId,
 *   status_group: statusGroup,
 * }));
 * ```
 */
export function createDbBreadcrumb(
  options: DbQueryContext & { message: string; level?: BreadcrumbLevel }
): Breadcrumb {
  const { message, level = 'info', ...data } = options;

  return {
    category: 'db.query',
    message,
    level,
    data: data as Record<string, unknown>,
  };
}

/**
 * Create a flow state transition breadcrumb
 *
 * @example
 * ```ts
 * Sentry.addBreadcrumb(createFlowBreadcrumb({
 *   previousState: 'setup',
 *   newState: 'recording',
 *   sessionId: session.id,
 * }));
 * ```
 */
export function createFlowBreadcrumb(
  options: Omit<FlowTransitionContext, 'timestamp'> & { timestamp?: number }
): Breadcrumb {
  const { previous_state, new_state, ...rest } = options;

  return {
    category: 'recording_flow',
    message: `State transition: ${previous_state} → ${new_state}`,
    level: new_state === 'error' ? 'warning' : 'info',
    data: {
      previous_state,
      new_state,
      timestamp: options.timestamp ?? Date.now(),
      ...rest,
    },
  };
}

/**
 * Create an API call breadcrumb
 *
 * @example
 * ```ts
 * Sentry.addBreadcrumb(createApiBreadcrumb({
 *   endpoint: '/session/upload/init',
 *   method: 'POST',
 *   hasError: false,
 *   responseTime: 234,
 * }));
 * ```
 */
export function createApiBreadcrumb(options: {
  endpoint: string;
  method: string;
  hasError: boolean;
  responseTime?: number;
  additionalData?: Record<string, unknown>;
}): Breadcrumb {
  return {
    category: 'api',
    message: `${options.method} ${options.endpoint}`,
    level: options.hasError ? 'error' : 'info',
    data: {
      endpoint: options.endpoint,
      method: options.method,
      has_error: options.hasError,
      ...(options.responseTime !== undefined && {
        responseTime: options.responseTime,
      }),
      ...options.additionalData,
    },
  };
}

/**
 * Create an upload progress breadcrumb
 *
 * @example
 * ```ts
 * Sentry.addBreadcrumb(createUploadBreadcrumb({
 *   percentage: 50,
 *   uploadedBytes: 5000000,
 *   totalSize: 10000000,
 *   recordingId: 'rec_123',
 * }));
 * ```
 */
export function createUploadBreadcrumb(options: {
  percentage: number;
  uploadedBytes: number;
  totalSize: number;
  recordingId?: string;
  sessionId?: string;
}): Breadcrumb {
  return {
    category: 'upload',
    message: `Upload progress: ${options.percentage}%`,
    level: 'info',
    data: {
      uploadedBytes: options.uploadedBytes,
      totalSize: options.totalSize,
      percentage: options.percentage,
      ...(options.recordingId && { recordingId: options.recordingId }),
      ...(options.sessionId && { sessionId: options.sessionId }),
    },
  };
}

/**
 * Create a system/browser info breadcrumb
 *
 * @example
 * ```ts
 * Sentry.addBreadcrumb(createSystemBreadcrumb({
 *   browser: 'Chrome 120',
 *   os: 'macOS 14.2',
 *   screenResolution: '1920x1080',
 * }));
 * ```
 */
export function createSystemBreadcrumb(options: {
  browser?: string;
  os?: string;
  screenResolution?: string;
  additionalData?: Record<string, unknown>;
}): Breadcrumb {
  return {
    category: 'system',
    message: 'System metadata captured',
    level: 'info',
    data: {
      ...(options.browser && { browser: options.browser }),
      ...(options.os && { os: options.os }),
      ...(options.screenResolution && {
        screen_resolution: options.screenResolution,
      }),
      ...options.additionalData,
    },
  };
}

/**
 * Create a browser error breadcrumb
 *
 * @example
 * ```ts
 * Sentry.addBreadcrumb(createBrowserErrorBreadcrumb({
 *   errorName: 'NotAllowedError',
 *   errorCode: 'CLIENT_PERMISSION_DENIED',
 *   errorMessage: 'Permission denied by user',
 * }));
 * ```
 */
export function createBrowserErrorBreadcrumb(options: {
  errorName: string;
  errorCode: string;
  errorMessage?: string;
}): Breadcrumb {
  return {
    category: 'browser_error',
    message: `Browser error: ${options.errorName}`,
    level: 'error',
    data: {
      error_name: options.errorName,
      error_code: options.errorCode,
      ...(options.errorMessage && { error_message: options.errorMessage }),
    },
  };
}
