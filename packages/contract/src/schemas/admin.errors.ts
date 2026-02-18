/**
 * Admin errors
 * From AdminService and admin middleware
 * Status codes follow HTTP semantics:
 *   400 - Bad Request (validation errors)
 *   401 - Unauthorized (authentication errors)
 *   403 - Forbidden (authorization errors)
 *   404 - Not Found (resource not found)
 */
export const AdminErrors = {
  // Authentication errors
  UNAUTHORIZED: {
    status: 401,
    message: 'You must be logged in to access this resource',
  },

  // Authorization errors
  FORBIDDEN: {
    status: 403,
    message: 'You do not have permission to perform this action',
  },

  NOT_ADMIN: {
    status: 403,
    message: 'Admin access required',
  },

  // Not found errors
  USER_NOT_FOUND: {
    status: 404,
    message: 'User not found',
  },

  SESSION_NOT_FOUND: {
    status: 404,
    message: 'Session not found',
  },

  // Validation errors
  INVALID_BAN_DURATION: {
    status: 400,
    message: 'Ban duration must be a positive number',
  },

  CANNOT_BAN_SELF: {
    status: 400,
    message: 'You cannot ban yourself',
  },

  CANNOT_BAN_ADMIN: {
    status: 400,
    message: 'You cannot ban another admin',
  },

  // Workspace errors
  WORKSPACE_NOT_FOUND: {
    status: 404,
    message: 'Workspace not found',
  },

  WORKSPACE_ALREADY_DEACTIVATED: {
    status: 400,
    message: 'Workspace is already deactivated',
  },

  WORKSPACE_NOT_DEACTIVATED: {
    status: 400,
    message: 'Workspace is not deactivated',
  },

  WORKSPACE_RESTORE_TIME_EXPIRED: {
    status: 410,
    message: 'Workspace restoration window has expired',
  },

  WORKSPACE_RESTORE_FAILED: {
    status: 500,
    message: 'Failed to restore workspace',
  },

  // Project errors
  PROJECT_NOT_FOUND: {
    status: 404,
    message: 'Project not found',
  },

  PROJECT_RESTORE_TIME_EXPIRED: {
    status: 410,
    message: 'Project restoration window has expired',
  },

  PROJECT_RESTORE_FAILED: {
    status: 500,
    message: 'Failed to restore project',
  },

  // Recording errors
  RECORDING_NOT_FOUND: {
    status: 404,
    message: 'Recording not found',
  },

  RECORDING_ALREADY_DELETED: {
    status: 400,
    message: 'Recording is already deleted',
  },

  RECORDING_NOT_DELETED: {
    status: 400,
    message: 'Recording is not deleted',
  },

  // Plan errors
  PLAN_NOT_FOUND: {
    status: 404,
    message: 'Plan product not found',
  },

  PLAN_CREATE_FAILED: {
    status: 502,
    message: 'Failed to create plan product in DodoPayments',
  },

  PLAN_UPDATE_FAILED: {
    status: 502,
    message: 'Failed to update plan product in DodoPayments',
  },
} as const;
