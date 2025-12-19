/**
 * Simplified Error Handling System
 * Maps HTTP status codes and browser errors to recovery strategies
 */

import {
  STATUS_ERROR_TITLES,
  BROWSER_ERROR_MESSAGES,
  ERROR_ACTION_TEXT,
} from '@/constants/copy/errors';

/**
 * Error categories
 */
export enum ErrorCategory {
  AUTH = 'auth',
  PERMISSION = 'permission',
  COMPATIBILITY = 'compatibility',
  RECORDING = 'recording',
  UPLOAD = 'upload',
  NETWORK = 'network',
  UNKNOWN = 'unknown',
}

/**
 * Recovery strategies
 */
export enum RecoveryStrategy {
  NONE = 'none',
  AUTO_RETRY = 'auto_retry',
  MANUAL_RETRY = 'manual_retry',
  START_OVER = 'start_over',
}

/**
 * Structured error
 */
export interface RecordingError {
  category: ErrorCategory;
  title: string;
  message: string;
  recoveryStrategy: RecoveryStrategy;
  primaryActionText?: string;
  secondaryActionText?: string;
  isPostRecording: boolean;
  originalError?: any;
}

/**
 * API error format
 */
export interface ApiError {
  status: number;
  message?: string;
}

/**
 * Browser error names
 */
export const BROWSER_ERRORS = {
  NOT_ALLOWED: 'NotAllowedError',
  NOT_SUPPORTED: 'NotSupportedError',
  ABORT: 'AbortError',
} as const;

/**
 * Status code → Recovery strategy mapping
 */
function getRecoveryStrategyFromStatus(status: number, isPostRecording: boolean): RecoveryStrategy {
  // 400 - Bad request (validation, constraints) → Usually START_OVER
  if (status === 400) {
    return isPostRecording ? RecoveryStrategy.START_OVER : RecoveryStrategy.NONE;
  }

  // 401, 403, 404, 409, 410 - Auth/permission/resource issues → NONE (need new link)
  if ([401, 403, 404, 409, 410].includes(status)) {
    return RecoveryStrategy.NONE;
  }

  // 429 - Rate limit → AUTO_RETRY
  if (status === 429) {
    return RecoveryStrategy.AUTO_RETRY;
  }

  // 500+ - Server errors → AUTO_RETRY
  if (status >= 500) {
    return RecoveryStrategy.AUTO_RETRY;
  }

  // 0 or network errors → AUTO_RETRY
  if (status === 0) {
    return RecoveryStrategy.AUTO_RETRY;
  }

  // Unknown status → START_OVER
  return RecoveryStrategy.START_OVER;
}

/**
 * Status code → Error title
 */
function getTitleFromStatus(status: number): string {
  if (status === 0) return STATUS_ERROR_TITLES[0];
  if (status === 400) return STATUS_ERROR_TITLES[400];
  if (status === 401 || status === 403) return STATUS_ERROR_TITLES[403];
  if (status === 404) return STATUS_ERROR_TITLES[404];
  if (status === 409) return STATUS_ERROR_TITLES[409];
  if (status === 410) return STATUS_ERROR_TITLES[410];
  if (status === 429) return STATUS_ERROR_TITLES[429];
  if (status >= 500) return STATUS_ERROR_TITLES[500];
  return STATUS_ERROR_TITLES.default;
}

/**
 * Recovery strategy → Action button text
 */
function getActionText(
  strategy: RecoveryStrategy,
  isPostRecording: boolean
): { primary?: string; secondary?: string } {
  switch (strategy) {
    case RecoveryStrategy.AUTO_RETRY:
      return {
        primary: ERROR_ACTION_TEXT.retryNow,
        secondary: isPostRecording ? ERROR_ACTION_TEXT.startOver : undefined,
      };
    case RecoveryStrategy.MANUAL_RETRY:
      return { primary: ERROR_ACTION_TEXT.tryAgain };
    case RecoveryStrategy.START_OVER:
      return { primary: ERROR_ACTION_TEXT.startOver };
    case RecoveryStrategy.NONE:
    default:
      return {};
  }
}

/**
 * Classify API error (uses status code)
 */
function classifyApiError(error: ApiError, isPostRecording: boolean): RecordingError {
  const status = error.status;
  const recoveryStrategy = getRecoveryStrategyFromStatus(status, isPostRecording);
  const title = getTitleFromStatus(status);
  const actions = getActionText(recoveryStrategy, isPostRecording);

  // Determine category based on status
  let category: ErrorCategory;
  if ([401, 403, 404, 409, 410].includes(status)) {
    category = ErrorCategory.AUTH;
  } else if (status >= 500) {
    category = ErrorCategory.NETWORK;
  } else if (status === 0) {
    category = ErrorCategory.NETWORK;
  } else if (isPostRecording) {
    category = ErrorCategory.UPLOAD;
  } else {
    category = ErrorCategory.UNKNOWN;
  }

  return {
    category,
    title,
    message: error.message || title, // Use API message or fallback to title
    recoveryStrategy,
    primaryActionText: actions.primary,
    secondaryActionText: actions.secondary,
    isPostRecording,
    originalError: error,
  };
}

/**
 * Classify browser error (uses error name)
 */
function classifyBrowserError(error: Error, isPostRecording: boolean): RecordingError {
  const errorName = error.name;

  // Permission denied
  if (errorName === BROWSER_ERRORS.NOT_ALLOWED) {
    return {
      category: ErrorCategory.PERMISSION,
      title: BROWSER_ERROR_MESSAGES.permission.title,
      message: BROWSER_ERROR_MESSAGES.permission.message,
      recoveryStrategy: RecoveryStrategy.MANUAL_RETRY,
      primaryActionText: ERROR_ACTION_TEXT.tryAgain,
      isPostRecording,
      originalError: error,
    };
  }

  // Not supported
  if (errorName === BROWSER_ERRORS.NOT_SUPPORTED) {
    return {
      category: ErrorCategory.COMPATIBILITY,
      title: BROWSER_ERROR_MESSAGES.notSupported.title,
      message: BROWSER_ERROR_MESSAGES.notSupported.message,
      recoveryStrategy: RecoveryStrategy.NONE,
      isPostRecording,
      originalError: error,
    };
  }

  // Recording aborted/stopped
  if (errorName === BROWSER_ERRORS.ABORT || isPostRecording) {
    return {
      category: ErrorCategory.RECORDING,
      title: BROWSER_ERROR_MESSAGES.recordingStopped.title,
      message: BROWSER_ERROR_MESSAGES.recordingStopped.message,
      recoveryStrategy: RecoveryStrategy.START_OVER,
      primaryActionText: ERROR_ACTION_TEXT.startOver,
      isPostRecording,
      originalError: error,
    };
  }

  // Unknown browser error
  return {
    category: ErrorCategory.UNKNOWN,
    title: BROWSER_ERROR_MESSAGES.unknown.title,
    message: BROWSER_ERROR_MESSAGES.unknown.message,
    recoveryStrategy: RecoveryStrategy.START_OVER,
    primaryActionText: ERROR_ACTION_TEXT.startOver,
    isPostRecording,
    originalError: error,
  };
}

/**
 * Main classification function
 * Auto-detects error type and classifies accordingly
 */
export function classifyError(
  error: string | Error | ApiError | null | undefined,
  isPostRecording: boolean = false
): RecordingError {
  // No error
  if (!error) {
    return {
      category: ErrorCategory.UNKNOWN,
      title: BROWSER_ERROR_MESSAGES.unknown.title,
      message: BROWSER_ERROR_MESSAGES.unknown.message,
      recoveryStrategy: RecoveryStrategy.START_OVER,
      primaryActionText: ERROR_ACTION_TEXT.startOver,
      isPostRecording,
    };
  }

  // Log error for debugging
  console.log('[classifyError] Error type:', typeof error);
  console.log('[classifyError] Error:', error);
  if (typeof error === 'object' && error !== null) {
    console.log('[classifyError] Error keys:', Object.keys(error));
    console.log('[classifyError] Error status:', (error as any).status);
    console.log('[classifyError] Error code:', (error as any).code);
    console.log('[classifyError] Error message:', (error as any).message);
  }

  // API error (has status property)
  if (typeof error === 'object' && 'status' in error) {
    return classifyApiError(error as ApiError, isPostRecording);
  }

  // Browser error (Error instance)
  if (error instanceof Error) {
    return classifyBrowserError(error, isPostRecording);
  }

  // String error (fallback)
  return {
    category: ErrorCategory.UNKNOWN,
    title: BROWSER_ERROR_MESSAGES.unknown.title,
    message: typeof error === 'string' ? error : BROWSER_ERROR_MESSAGES.unknown.message,
    recoveryStrategy: RecoveryStrategy.START_OVER,
    primaryActionText: ERROR_ACTION_TEXT.startOver,
    isPostRecording,
    originalError: error,
  };
}

/**
 * Parse fetch/response error into ApiError format
 */
export async function parseApiError(error: any): Promise<ApiError> {
  // Response object
  if (error instanceof Response) {
    try {
      const body = await error.json();
      return {
        status: error.status,
        message: body.message || body.error || error.statusText,
      };
    } catch {
      return {
        status: error.status,
        message: error.statusText,
      };
    }
  }

  // Fetch network error
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      status: 0,
      message: 'Network error',
    };
  }

  // Already has status
  if (error && typeof error === 'object' && 'status' in error) {
    return {
      status: error.status,
      message: error.message,
    };
  }

  // Fallback
  return {
    status: 0,
    message: error?.message || 'Unknown error',
  };
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: RecordingError): boolean {
  return error.recoveryStrategy !== RecoveryStrategy.NONE;
}
