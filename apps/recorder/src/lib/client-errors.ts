/**
 * Client Error Handling
 * Type-locked config for browser/media errors
 */

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
