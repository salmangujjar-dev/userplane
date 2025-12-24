/**
 * Session errors
 * From SessionService
 */
export const SessionErrors = {
  SESSION_LINK_GONE: {
    message: "Link's expired, try requesting a new one",
  },
  SESSION_LINK_NOT_FOUND: {
    message: "Link doesn't seem to exist, try requesting a new one",
  },
  SESSION_LINK_INVALID_TYPE: {
    message: "Link isn't set up for recordings",
  },
  SESSION_LINK_ALREADY_USED: {
    message: "Link's been used already, grab a new one",
  },
  SESSION_TOKEN_EXPIRED: {
    message: "Session's expired, let's start over",
  },
  SESSION_DURATION_TOO_SHORT: {
    message: 'Recording needs to be a bit longer',
  },
  SESSION_DURATION_TOO_LONG: {
    message: 'Recording ran too long, try keeping it shorter',
  },
  SESSION_VIDEO_MISSING: {
    message: "Video's missing, try recording again",
  },
  SESSION_VIDEO_EMPTY: {
    message: 'Video file is empty, try recording again',
  },
  SESSION_FILE_FORMAT_UNSUPPORTED: {
    message: "Format's not supported, try recording again",
  },
  SESSION_FILE_TOO_LARGE: {
    message: "File's too big, try recording something shorter",
  },
  SESSION_UPLOAD_TOKEN_EXPIRED: {
    message: 'Upload session expired, try uploading again',
  },
  SESSION_UPLOAD_TOKEN_MISMATCH: {
    message: 'Upload got mixed up, try again',
  },
  SESSION_RECORDING_GONE: {
    message: "Recording's expired, try starting fresh",
  },
  SESSION_RECORDING_NOT_FOUND: {
    message: "Can't find that recording, try again",
  },
  SESSION_UPLOAD_FAILED: {
    message: "Couldn't finalize upload, try again",
  },
  SESSION_FILE_VERIFICATION_FAILED: {
    message: "Couldn't verify files, try uploading again",
  },
} as const;
