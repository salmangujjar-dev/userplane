/**
 * Session errors
 * From SessionService and session route middlewares
 * Status codes follow HTTP semantics:
 *   400 - Bad Request (validation, format errors)
 *   401 - Unauthorized (authentication/token errors)
 *   403 - Forbidden (authorization errors)
 *   404 - Not Found (resource not found)
 *   410 - Gone (resource permanently deleted)
 *   500 - Internal Server Error (infrastructure errors)
 */
export const SessionErrors = {
  // Link token errors (from LinkService.verifyLinkToken)
  LINK_TOKEN_MISSING_ID: {
    status: 400,
    message: 'Invalid link token: missing link ID',
  },
  LINK_TOKEN_EXPIRED: {
    status: 401,
    message: 'Link token has expired',
  },
  LINK_TOKEN_INVALID: {
    status: 401,
    message: 'Invalid link token',
  },

  // Route middleware errors
  SESSION_TOKEN_MISSING: {
    status: 401,
    message: 'Session token required in x-userplane-session-token header',
  },
  UPLOAD_TOKEN_MISSING: {
    status: 401,
    message: 'Upload token required in x-userplane-upload-token header',
  },

  // Link state errors
  SESSION_LINK_GONE: {
    status: 410,
    message: "Link's expired, try requesting a new one",
  },
  SESSION_LINK_NOT_FOUND: {
    status: 404,
    message: "Link doesn't seem to exist, try requesting a new one",
  },
  SESSION_LINK_INVALID_TYPE: {
    status: 400,
    message: "Link isn't set up for recordings",
  },
  SESSION_LINK_ALREADY_USED: {
    status: 403,
    message: "Link's been used already, grab a new one",
  },

  // Session token errors
  SESSION_TOKEN_EXPIRED: {
    status: 401,
    message: "Session's expired, let's start over",
  },

  // Recording validation errors
  SESSION_DURATION_TOO_SHORT: {
    status: 400,
    message: 'Recording needs to be a bit longer',
  },
  SESSION_DURATION_TOO_LONG: {
    status: 400,
    message: 'Recording ran too long, try keeping it shorter',
  },

  // File validation errors
  SESSION_VIDEO_MISSING: {
    status: 400,
    message: "Video's missing, try recording again",
  },
  SESSION_VIDEO_EMPTY: {
    status: 400,
    message: 'Video file is empty, try recording again',
  },
  SESSION_FILE_FORMAT_UNSUPPORTED: {
    status: 400,
    message: "Format's not supported, try recording again",
  },
  SESSION_FILE_TOO_LARGE: {
    status: 400,
    message: "File's too big, try recording something shorter",
  },

  // Upload token errors
  SESSION_UPLOAD_TOKEN_EXPIRED: {
    status: 401,
    message: 'Upload session expired, try uploading again',
  },
  SESSION_UPLOAD_TOKEN_MISMATCH: {
    status: 400,
    message: 'Upload got mixed up, try again',
  },

  // Recording state errors
  SESSION_RECORDING_GONE: {
    status: 410,
    message: "Recording's expired, try starting fresh",
  },
  SESSION_RECORDING_NOT_FOUND: {
    status: 404,
    message: "Can't find that recording, try again",
  },

  // Upload completion errors
  SESSION_UPLOAD_FAILED: {
    status: 500,
    message: "Couldn't finalize upload, try again",
  },
  SESSION_FILE_VERIFICATION_FAILED: {
    status: 400,
    message: "Couldn't verify files, try uploading again",
  },

  // Infrastructure errors
  SESSION_STORAGE_ERROR: {
    status: 500,
    message: 'Storage operation failed, try again',
  },
  SESSION_DATABASE_ERROR: {
    status: 500,
    message: 'Database operation failed, try again',
  },

  // Entitlement errors
  SESSION_RECORDING_LIMIT_EXCEEDED: {
    status: 403,
    message: "You've reached your recording limit. Upgrade your plan for more recordings.",
  },
} as const;
