/**
 * Share errors
 * For public share token endpoints
 */
export const ShareErrors = {
  // Authentication errors (from auth middleware)
  UNAUTHORIZED: {
    status: 401,
    message: 'You must be logged in to access this resource',
  },

  // Authorization errors
  FORBIDDEN: {
    status: 403,
    message: 'Insufficient permissions',
  },

  // Token errors
  SHARE_TOKEN_INVALID: {
    status: 401,
    message: 'Share token is invalid',
  },
  SHARE_TOKEN_EXPIRED: {
    status: 401,
    message: 'Share link has expired',
  },

  // Not found errors
  RECORDING_NOT_FOUND: {
    status: 404,
    message: 'Recording not found',
  },

  // Gone errors
  RECORDING_GONE: {
    status: 410,
    message: 'Recording has been deleted',
  },

  // Infrastructure errors
  SHARE_TOKEN_GENERATION_FAILED: {
    status: 500,
    message: 'Failed to generate share token',
  },
} as const;
