/**
 * Error Types and Utilities
 * Core types and classification for recording errors
 */

import { getClientError } from '@/lib/client-errors';

/**
 * What action to take when user clicks the button
 */
export type ErrorAction = 'retry-upload' | 'reload' | 'start-over';

/**
 * Action button config
 */
export interface ErrorActionButton {
  label: string;
  action: ErrorAction;
}

/**
 * Recording error - what to show and what to do
 */
export interface RecordingError {
  title: string;
  message: string;
  primaryAction?: ErrorActionButton;
  secondaryAction?: ErrorActionButton;
}

/**
 * Default error for unknown issues
 */
const DEFAULT_ERROR: RecordingError = {
  title: 'Something went wrong',
  message: "Let's try again",
  primaryAction: { label: 'Start over', action: 'start-over' },
};

/**
 * Check if error is already a RecordingError
 */
function isRecordingError(error: unknown): error is RecordingError {
  return typeof error === 'object' && error !== null && 'title' in error && 'message' in error;
}

/**
 * Classify any error into a RecordingError
 *
 * If the error is already a RecordingError (from server error handling),
 * it's returned as-is. Otherwise, it's classified as a client/unknown error.
 */
export function classifyError(
  error: string | Error | RecordingError | null | undefined
): RecordingError {
  // No error
  if (!error) {
    return DEFAULT_ERROR;
  }

  // Already a RecordingError (from server error handling)
  if (isRecordingError(error)) {
    return error;
  }

  // Client error (Error instance)
  if (error instanceof Error) {
    return getClientError(error);
  }

  // String error (fallback)
  return {
    ...DEFAULT_ERROR,
    message: typeof error === 'string' ? error : DEFAULT_ERROR.message,
  };
}
