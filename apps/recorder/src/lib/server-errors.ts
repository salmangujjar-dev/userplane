/**
 * Server Error Handling
 * Type-locked config for oRPC/API errors
 */

import { isDefinedError } from '@workspace/client';
import { SessionErrors } from '@workspace/contract';
import type { RecordingError } from '@/types/errors';

/**
 * Type-safe session error codes from contract
 */
type SessionErrorCode = keyof typeof SessionErrors;

/**
 * Result type for server operations
 */
export type ServerResult<T> =
  | { ok: true; data: T; error?: never }
  | { ok: false; data?: never; error: RecordingError };

/**
 * Session error config - type-locked to contract.
 * Each error specifies exactly what to show and do.
 */
const SESSION_ERROR_CONFIG: Record<SessionErrorCode, RecordingError> = {
  // Link errors - no recovery (need new link)
  SESSION_LINK_GONE: {
    title: "Link's expired",
    message: 'Try requesting a new one',
  },
  SESSION_LINK_NOT_FOUND: {
    title: "Link doesn't exist",
    message: 'Try requesting a new one',
  },
  SESSION_LINK_INVALID_TYPE: {
    title: "Link isn't for recording",
    message: 'Check with the person who sent it',
  },
  SESSION_LINK_ALREADY_USED: {
    title: "Link's been used",
    message: 'Grab a new one',
  },

  // Token errors - start over
  SESSION_TOKEN_EXPIRED: {
    title: 'Session expired',
    message: "Let's start fresh",
    primaryAction: { label: 'Start over', action: 'start-over' },
  },
  SESSION_UPLOAD_TOKEN_EXPIRED: {
    title: 'Upload session expired',
    message: 'Try uploading again',
    primaryAction: { label: 'Start over', action: 'start-over' },
  },
  SESSION_UPLOAD_TOKEN_MISMATCH: {
    title: 'Upload got mixed up',
    message: "Let's try again",
    primaryAction: { label: 'Start over', action: 'start-over' },
  },

  // Recording errors - start over
  SESSION_RECORDING_GONE: {
    title: "Recording's expired",
    message: 'Try starting fresh',
    primaryAction: { label: 'Start over', action: 'start-over' },
  },
  SESSION_RECORDING_NOT_FOUND: {
    title: "Can't find that recording",
    message: 'Try again',
    primaryAction: { label: 'Start over', action: 'start-over' },
  },
  SESSION_DURATION_TOO_SHORT: {
    title: 'Recording too short',
    message: 'Try recording a bit longer',
    primaryAction: { label: 'Start over', action: 'start-over' },
  },
  SESSION_DURATION_TOO_LONG: {
    title: 'Recording too long',
    message: 'Try keeping it shorter',
    primaryAction: { label: 'Start over', action: 'start-over' },
  },
  SESSION_VIDEO_MISSING: {
    title: "Video's missing",
    message: 'Try recording again',
    primaryAction: { label: 'Start over', action: 'start-over' },
  },
  SESSION_VIDEO_EMPTY: {
    title: 'Video file is empty',
    message: 'Try recording again',
    primaryAction: { label: 'Start over', action: 'start-over' },
  },

  // File validation errors - start over
  SESSION_FILE_FORMAT_UNSUPPORTED: {
    title: "Format's not supported",
    message: 'Try recording again',
    primaryAction: { label: 'Start over', action: 'start-over' },
  },
  SESSION_FILE_TOO_LARGE: {
    title: "File's too big",
    message: 'Try recording something shorter',
    primaryAction: { label: 'Start over', action: 'start-over' },
  },

  // Upload errors - retry
  SESSION_UPLOAD_FAILED: {
    title: 'Upload failed',
    message: "Let's try again",
    primaryAction: { label: 'Retry', action: 'retry-upload' },
    secondaryAction: { label: 'Start over', action: 'start-over' },
  },
  SESSION_FILE_VERIFICATION_FAILED: {
    title: "Couldn't verify files",
    message: 'Try uploading again',
    primaryAction: { label: 'Retry', action: 'retry-upload' },
    secondaryAction: { label: 'Start over', action: 'start-over' },
  },
};

/**
 * Default error for unknown server errors
 */
const DEFAULT_SERVER_ERROR: RecordingError = {
  title: 'Something went wrong',
  message: "Let's try again",
  primaryAction: { label: 'Retry', action: 'reload' },
};

/**
 * Network error
 */
const NETWORK_ERROR: RecordingError = {
  title: 'Connection issue',
  message: 'Check your connection and try again',
  primaryAction: { label: 'Retry', action: 'reload' },
};

/**
 * Check if code is a known session error
 */
function isSessionErrorCode(code: string): code is SessionErrorCode {
  return code in SESSION_ERROR_CONFIG;
}

/**
 * Get error config for a session error code
 */
function getSessionError(code: string): RecordingError {
  if (isSessionErrorCode(code)) {
    return SESSION_ERROR_CONFIG[code];
  }
  return DEFAULT_SERVER_ERROR;
}

/**
 * Process safe client result into ServerResult
 */
export function handleServerResult<T>(error: unknown, data: T | undefined | null): ServerResult<T> {
  if (error) {
    console.log('[Server] Error:', error);

    // Defined API error - use config
    if (isDefinedError(error)) {
      const err = error as { code: string };
      console.log('[Server] Defined error:', err.code);
      return { ok: false, error: getSessionError(err.code) };
    }

    // Network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { ok: false, error: NETWORK_ERROR };
    }

    // Unknown error
    console.log('[Server] Unknown error');
    return { ok: false, error: DEFAULT_SERVER_ERROR };
  }

  if (data === undefined || data === null) {
    return { ok: false, error: DEFAULT_SERVER_ERROR };
  }

  return { ok: true, data };
}
