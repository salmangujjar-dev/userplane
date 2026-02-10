/**
 * Recording errors
 * From RecordingService, auth middleware, and workspace middleware
 * Status codes follow HTTP semantics and match actual service implementation:
 *   401 - Unauthorized (authentication errors)
 *   403 - Forbidden (authorization errors)
 *   404 - Not Found (resource not found)
 *   410 - Gone (resource permanently deleted)
 *   500 - Internal Server Error (infrastructure errors)
 */
export const RecordingErrors = {
  // Authentication errors (from auth middleware)
  UNAUTHORIZED: {
    status: 401,
    message: 'You must be logged in to access this resource',
  },

  // Authorization errors (from RecordingService and workspace middleware)
  FORBIDDEN: {
    status: 403,
    message: 'Insufficient permissions',
  },
  RECORDING_DELETE_FORBIDDEN: {
    status: 403,
    message: 'You do not have permission to delete this recording',
  },
  RECORDING_WORKSPACE_MISMATCH: {
    status: 403,
    message: 'Recording does not belong to this workspace',
  },

  // Not found errors
  RECORDING_NOT_FOUND: {
    status: 404,
    message: 'Recording not found',
  },

  // Gone errors
  RECORDING_GONE: {
    status: 410,
    message: 'Recording has already been deleted',
  },

  // Infrastructure errors
  RECORDING_DELETE_FAILED: {
    status: 500,
    message: 'Failed to delete recording',
  },
  RECORDING_UPDATE_FAILED: {
    status: 500,
    message: 'Failed to update recording',
  },
} as const;
