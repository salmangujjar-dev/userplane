/**
 * Server Error Handling
 * Type-locked config for oRPC/API errors
 */

import { isDefinedError } from '@userplane/client';

import { createLogger } from '@/lib/logger';
import { BillingErrors, SessionErrors } from '@/types';
import type { RecordingError } from '@/types/errors';

const logger = createLogger('server-errors');

/**
 * Type-safe error codes from session and billing contracts
 * Session endpoints can throw both SessionErrors and select BillingErrors
 */
type SessionErrorCode = keyof typeof SessionErrors;
type SessionBillingErrorCode = Extract<keyof typeof BillingErrors, 'PLAN_LIMIT_EXCEEDED'>;

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
const SESSION_ERROR_CONFIG: Record<SessionErrorCode | SessionBillingErrorCode, RecordingError> = {
  // Link token errors
  LINK_TOKEN_MISSING_ID: {
    title: 'Invalid link',
    message: "Looks like this link didn't come through properly.",
  },
  LINK_TOKEN_EXPIRED: {
    title: 'Link expired',
    message: 'No worries — you can request a new one.',
  },
  LINK_TOKEN_INVALID: {
    title: 'Invalid link',
    message: "This link can't be used anymore.",
  },

  // Link errors — no recovery
  SESSION_LINK_GONE: {
    title: 'Link expired',
    message: 'This link is no longer active.',
  },
  SESSION_LINK_NOT_FOUND: {
    title: 'Link not found',
    message: "We couldn't find this link.",
  },
  SESSION_LINK_INVALID_TYPE: {
    title: 'Wrong link',
    message: "This link isn't meant for recording.",
  },
  SESSION_LINK_ALREADY_USED: {
    title: 'Link already used',
    message: 'Each link can only be used once.',
  },

  // Token missing — start over
  SESSION_TOKEN_MISSING: {
    title: 'Session missing',
    message: 'Something got interrupted along the way.',
    primaryAction: { label: 'Start over', action: 'start-over' },
  },
  UPLOAD_TOKEN_MISSING: {
    title: 'Upload missing',
    message: "Something didn't load correctly.",
    primaryAction: { label: 'Start over', action: 'start-over' },
  },

  // Token expired — start over
  SESSION_TOKEN_EXPIRED: {
    title: 'Session expired',
    message: 'That took a bit too long.',
    primaryAction: { label: 'Start over', action: 'start-over' },
  },
  SESSION_UPLOAD_TOKEN_EXPIRED: {
    title: 'Upload expired',
    message: 'The upload timed out.',
    primaryAction: { label: 'Start over', action: 'start-over' },
  },
  SESSION_UPLOAD_TOKEN_MISMATCH: {
    title: 'Upload interrupted',
    message: 'Something got mixed up.',
    primaryAction: { label: 'Start over', action: 'start-over' },
  },

  // Recording errors — start over
  SESSION_RECORDING_GONE: {
    title: 'Recording expired',
    message: 'That recording is no longer available.',
    primaryAction: { label: 'Start over', action: 'start-over' },
  },
  SESSION_RECORDING_NOT_FOUND: {
    title: 'Recording not found',
    message: "We couldn't locate it.",
    primaryAction: { label: 'Start over', action: 'start-over' },
  },
  SESSION_DURATION_TOO_SHORT: {
    title: 'Recording too short',
    message: 'Try recording for a little longer.',
    primaryAction: { label: 'Start over', action: 'start-over' },
  },
  SESSION_DURATION_TOO_LONG: {
    title: 'Recording too long',
    message: 'Try keeping it a bit shorter.',
    primaryAction: { label: 'Start over', action: 'start-over' },
  },
  SESSION_VIDEO_MISSING: {
    title: 'Video missing',
    message: "We didn't receive a video file.",
    primaryAction: { label: 'Start over', action: 'start-over' },
  },
  SESSION_VIDEO_EMPTY: {
    title: 'Empty video',
    message: "The video didn't contain any data.",
    primaryAction: { label: 'Start over', action: 'start-over' },
  },

  // File validation errors
  SESSION_FILE_FORMAT_UNSUPPORTED: {
    title: 'Unsupported format',
    message: "This file type isn't supported.",
    primaryAction: { label: 'Start over', action: 'start-over' },
  },
  SESSION_FILE_TOO_LARGE: {
    title: 'File too large',
    message: 'Try recording a shorter clip.',
    primaryAction: { label: 'Start over', action: 'start-over' },
  },

  // Upload errors — retry
  SESSION_UPLOAD_FAILED: {
    title: 'Upload failed',
    message: "That didn't go through.",
    primaryAction: { label: 'Retry', action: 'retry-upload' },
    secondaryAction: { label: 'Start over', action: 'start-over' },
  },
  SESSION_FILE_VERIFICATION_FAILED: {
    title: 'Upload issue',
    message: "We couldn't verify the upload.",
    primaryAction: { label: 'Retry', action: 'retry-upload' },
    secondaryAction: { label: 'Start over', action: 'start-over' },
  },

  // Infrastructure errors — retry
  SESSION_STORAGE_ERROR: {
    title: 'Storage issue',
    message: "This one's on us.",
    primaryAction: { label: 'Retry', action: 'retry-upload' },
    secondaryAction: { label: 'Start over', action: 'start-over' },
  },
  SESSION_DATABASE_ERROR: {
    title: 'Server issue',
    message: 'We hit a snag.',
    primaryAction: { label: 'Retry', action: 'retry-upload' },
    secondaryAction: { label: 'Start over', action: 'start-over' },
  },

  // Entitlement errors — no recovery
  PLAN_LIMIT_EXCEEDED: {
    title: 'Recording limit reached',
    message: 'Upgrade your plan to record more.',
  },
};

/**
 * Default error for unknown server errors
 */
const DEFAULT_SERVER_ERROR: RecordingError = {
  title: 'Something went wrong',
  message: "Looks like we hit a snag. Let's try again.",
  primaryAction: { label: 'Retry', action: 'reload' },
};

/**
 * Network error
 */
const NETWORK_ERROR: RecordingError = {
  title: 'Connection issue',
  message: "We couldn't reach the servers. Let's try again.",
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
    // Defined API error - use config
    if (isDefinedError(error)) {
      const err = error as { code: string };
      return { ok: false, error: getSessionError(err.code) };
    }

    // Network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { ok: false, error: NETWORK_ERROR };
    }

    // Unknown error
    logger.error({ err: error }, 'unclassified server error');
    return { ok: false, error: DEFAULT_SERVER_ERROR };
  }

  if (data === undefined || data === null) {
    return { ok: false, error: DEFAULT_SERVER_ERROR };
  }

  return { ok: true, data };
}
