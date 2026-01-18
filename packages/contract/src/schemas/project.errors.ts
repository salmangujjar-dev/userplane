/**
 * Project errors
 * From ProjectService, auth middleware, and workspace middleware
 * Status codes follow HTTP semantics and match actual service implementation:
 *   400 - Bad Request (validation errors)
 *   401 - Unauthorized (authentication errors)
 *   403 - Forbidden (authorization errors)
 *   404 - Not Found (resource not found)
 *   410 - Gone (resource permanently deleted)
 *   500 - Internal Server Error (infrastructure errors)
 */
export const ProjectErrors = {
  // Validation errors
  PROJECT_WORKSPACE_ID_REQUIRED: {
    status: 400,
    message: 'Workspace ID is required',
  },

  // Authentication errors (from auth middleware)
  UNAUTHORIZED: {
    status: 401,
    message: 'You must be logged in to access this resource',
  },

  // Authorization errors (from ProjectService and workspace middleware)
  FORBIDDEN: {
    status: 403,
    message: 'Insufficient permissions',
  },
  PROJECT_WORKSPACE_MISMATCH: {
    status: 403,
    message: 'Project does not belong to this workspace',
  },
  PROJECT_LAST_PROJECT_DELETE_FORBIDDEN: {
    status: 403,
    message: 'Cannot delete the only project in a workspace',
  },

  // Not found errors
  PROJECT_NOT_FOUND: {
    status: 404,
    message: 'Project not found',
  },
  PROJECT_DEFAULT_NOT_FOUND: {
    status: 404,
    message: 'No default project found for workspace',
  },

  // Gone errors
  PROJECT_GONE: {
    status: 410,
    message: 'Project has been deleted',
  },

  // Restoration errors
  PROJECT_NOT_DELETED: {
    status: 400,
    message: 'Project is not deleted and cannot be restored',
  },
  PROJECT_RESTORE_TIME_EXPIRED: {
    status: 410,
    message: 'Project restoration window has expired',
  },

  // Infrastructure errors
  PROJECT_CREATE_FAILED: {
    status: 500,
    message: 'Failed to create project',
  },
  PROJECT_UPDATE_FAILED: {
    status: 500,
    message: 'Failed to update project',
  },
  PROJECT_DELETE_FAILED: {
    status: 500,
    message: 'Failed to delete project',
  },
  PROJECT_RESTORE_FAILED: {
    status: 500,
    message: 'Failed to restore project',
  },
} as const;
