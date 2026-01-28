/**
 * Client Error Handling
 * Type-locked config for browser/media errors
 */

import * as Sentry from '@sentry/astro';
import { buildClientErrorTags, createBrowserErrorBreadcrumb, ErrorTypes } from '@workspace/sentry';

import type { RecordingError } from '@/types/errors';

/**
 * Client error codes - descriptive, self-documenting
 */
export const ClientErrors = {
  // Permission errors
  CLIENT_PERMISSION_DENIED: {},
  CLIENT_RECORDING_ABORTED: {},
  CLIENT_SECURITY_BLOCKED: {},

  // Device errors
  CLIENT_DEVICE_NOT_FOUND: {},
  CLIENT_DEVICE_IN_USE: {},
  CLIENT_DEVICE_INCOMPATIBLE: {},

  // Browser errors
  CLIENT_BROWSER_UNSUPPORTED: {},
  CLIENT_MEDIA_CONNECTION_FAILED: {},

  // Link validation errors
  CLIENT_LINK_TOKEN_MISSING: {},
  CLIENT_LINK_ACTION_MISSING: {},
  CLIENT_LINK_ACTION_INVALID: {},
  CLIENT_LINK_WORKSPACE_MISSING: {},
  CLIENT_LINK_WORKSPACE_MISMATCH: {},

  // Session validation errors
  CLIENT_SESSION_WORKSPACE_MISSING: {},
  CLIENT_SESSION_MISSING: {},

  // Recording validation errors
  CLIENT_RECORDING_MISSING: {},
  CLIENT_RECORDING_DURATION_EXCEEDED: {},
  CLIENT_RECORDING_SIZE_EXCEEDED: {},

  // Upload retry errors
  CLIENT_UPLOAD_STATE_MISSING: {},
} as const;

type ClientErrorCode = keyof typeof ClientErrors;

/**
 * Custom error class that carries our error code
 */
export class ClientError extends Error {
  readonly code: ClientErrorCode;

  constructor(code: ClientErrorCode, originalError?: Error) {
    super(originalError?.message || code);
    this.name = 'ClientError';
    this.code = code;
    if (originalError?.stack) {
      this.stack = originalError.stack;
    }
  }

  /**
   * Wrap a browser error with our error code
   */
  static fromBrowserError(error: Error): ClientError {
    const code = browserErrorToCode(error.name);

    // Add breadcrumb for browser errors
    Sentry.addBreadcrumb(
      createBrowserErrorBreadcrumb({
        errorName: error.name,
        errorCode: code,
        errorMessage: error.message,
      })
    );

    // Capture critical browser errors in Sentry
    const criticalErrors: ClientErrorCode[] = [
      'CLIENT_BROWSER_UNSUPPORTED',
      'CLIENT_MEDIA_CONNECTION_FAILED',
      'CLIENT_SECURITY_BLOCKED',
    ];

    if (criticalErrors.includes(code)) {
      Sentry.captureException(error, {
        tags: buildClientErrorTags({
          errorType: ErrorTypes.CRITICAL_BROWSER_ERROR,
          clientErrorCode: code,
        }),
      });
    }

    return new ClientError(code, error);
  }
}

/**
 * Map browser error name to our error code
 *
 * These errors come from the MediaDevices API when calling getUserMedia() or getDisplayMedia().
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#exceptions
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia#exceptions
 */
function browserErrorToCode(name: string): ClientErrorCode {
  switch (name) {
    // User denied permission, or permission was previously denied and remembered.
    // Can also occur if the document isn't fully active or doesn't have focus.
    // @see https://developer.mozilla.org/en-US/docs/Web/API/DOMException#notallowederror
    case 'NotAllowedError':
      return 'CLIENT_PERMISSION_DENIED';

    // User dismissed the screen picker dialog without selecting a screen,
    // or cancelled the permission prompt.
    // @see https://developer.mozilla.org/en-US/docs/Web/API/DOMException#aborterror
    case 'AbortError':
      return 'CLIENT_RECORDING_ABORTED';

    // Media support is disabled (e.g., document not loaded securely),
    // or blocked by Feature-Policy/Permissions-Policy.
    // @see https://developer.mozilla.org/en-US/docs/Web/API/DOMException#securityerror
    case 'SecurityError':
      return 'CLIENT_SECURITY_BLOCKED';

    // No media tracks of the requested type (audio/video) were found.
    // The user may not have a camera/microphone connected.
    // @see https://developer.mozilla.org/en-US/docs/Web/API/DOMException#notfounderror
    case 'NotFoundError':
      return 'CLIENT_DEVICE_NOT_FOUND';

    // Hardware device is already in use by another application.
    // Operating system, browser, or webpage has locked the device.
    // @see https://developer.mozilla.org/en-US/docs/Web/API/DOMException#notreadableerror
    case 'NotReadableError':
      return 'CLIENT_DEVICE_IN_USE';

    // No device matches the requested constraints (resolution, frame rate, etc.).
    // The device cannot satisfy the mandatory constraints specified.
    // @see https://developer.mozilla.org/en-US/docs/Web/API/DOMException#overconstrainederror
    case 'OverconstrainedError':
      return 'CLIENT_DEVICE_INCOMPATIBLE';

    // Browser doesn't support the requested media type or getDisplayMedia/getUserMedia API.
    // May also indicate the constraints include unsupported properties.
    // @see https://developer.mozilla.org/en-US/docs/Web/API/DOMException#notsupportederror
    case 'NotSupportedError':
      return 'CLIENT_BROWSER_UNSUPPORTED';

    // Constraints object is empty, or has all tracks set to false,
    // or an invalid constraints configuration was provided.
    // @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypeError
    case 'TypeError':
      return 'CLIENT_MEDIA_CONNECTION_FAILED';

    default:
      return 'CLIENT_MEDIA_CONNECTION_FAILED';
  }
}

/**
 * Client error config - type-locked to ClientErrors
 */
const CLIENT_ERROR_CONFIG: Record<ClientErrorCode, RecordingError> = {
  // Permission errors
  CLIENT_PERMISSION_DENIED: {
    title: 'Allow screen recording',
    message: 'Share your screen to start recording',
    primaryAction: { label: 'Try again', action: 'reload' },
  },
  CLIENT_RECORDING_ABORTED: {
    title: 'Recording stopped',
    message: 'Ready to try again?',
    primaryAction: { label: 'Start over', action: 'start-over' },
  },
  CLIENT_SECURITY_BLOCKED: {
    title: 'Recording blocked',
    message: 'Check your browser security settings',
  },

  // Device errors
  CLIENT_DEVICE_NOT_FOUND: {
    title: 'No recording device found',
    message: 'Check that your camera/mic is connected',
  },
  CLIENT_DEVICE_IN_USE: {
    title: 'Device is busy',
    message: 'Close other apps using your camera/mic',
    primaryAction: { label: 'Try again', action: 'reload' },
  },
  CLIENT_DEVICE_INCOMPATIBLE: {
    title: 'Device not compatible',
    message: 'Your device cannot meet recording requirements',
  },

  // Browser errors
  CLIENT_BROWSER_UNSUPPORTED: {
    title: 'Browser not supported',
    message: 'Try Chrome, Edge, or Firefox',
  },
  CLIENT_MEDIA_CONNECTION_FAILED: {
    title: 'Connection issue',
    message: 'Having trouble connecting to media devices',
    primaryAction: { label: 'Retry', action: 'reload' },
  },

  // Link validation errors
  CLIENT_LINK_TOKEN_MISSING: {
    title: 'Invalid link',
    message: 'No link token provided',
  },
  CLIENT_LINK_ACTION_MISSING: {
    title: 'Invalid link',
    message: 'No action specified in the link',
  },
  CLIENT_LINK_ACTION_INVALID: {
    title: 'Invalid action',
    message: 'This action is not supported',
  },
  CLIENT_LINK_WORKSPACE_MISSING: {
    title: 'Invalid link',
    message: 'No workspace ID provided in the link',
  },
  CLIENT_LINK_WORKSPACE_MISMATCH: {
    title: 'Workspace mismatch',
    message: 'This recording link is not valid for this workspace',
  },

  // Session validation errors
  CLIENT_SESSION_WORKSPACE_MISSING: {
    title: 'Invalid session',
    message: 'Session is missing workspace information',
  },
  CLIENT_SESSION_MISSING: {
    title: 'Session expired',
    message: 'No active session',
    primaryAction: { label: 'Start over', action: 'start-over' },
  },

  // Recording validation errors
  CLIENT_RECORDING_MISSING: {
    title: 'No recording',
    message: 'No recording to submit',
    primaryAction: { label: 'Start over', action: 'start-over' },
  },
  CLIENT_RECORDING_DURATION_EXCEEDED: {
    title: 'Recording too long',
    message: 'Recording duration exceeds the maximum allowed',
    primaryAction: { label: 'Start over', action: 'start-over' },
  },
  CLIENT_RECORDING_SIZE_EXCEEDED: {
    title: 'Recording too large',
    message: 'Recording size exceeds the maximum allowed',
    primaryAction: { label: 'Start over', action: 'start-over' },
  },

  // Upload retry errors
  CLIENT_UPLOAD_STATE_MISSING: {
    title: 'Cannot retry',
    message: 'No upload state available. Please start over.',
    primaryAction: { label: 'Start over', action: 'start-over' },
  },
};

/**
 * Get error config for client error
 */
export function getClientError(error: Error): RecordingError {
  // If it's already a ClientError, use its code directly
  if (error instanceof ClientError) {
    return CLIENT_ERROR_CONFIG[error.code];
  }

  // Otherwise map from browser error name
  const code = browserErrorToCode(error.name);
  return CLIENT_ERROR_CONFIG[code];
}

/**
 * Create a client error from error code
 * For use in validation and flow logic
 */
export function createClientError(code: ClientErrorCode): RecordingError {
  return CLIENT_ERROR_CONFIG[code];
}

/**
 * Create a client error with dynamic message
 * For errors that need runtime values (durations, sizes, etc.)
 */
export function createClientErrorWithMessage(
  code: ClientErrorCode,
  message: string
): RecordingError {
  const baseError = CLIENT_ERROR_CONFIG[code];
  return {
    ...baseError,
    message,
  };
}
