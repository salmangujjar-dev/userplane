/**
 * Link errors
 * From LinkService, auth middleware, and workspace middleware
 * Status codes follow HTTP semantics and match actual service implementation:
 *   400 - Bad Request (validation errors)
 *   401 - Unauthorized (authentication/token errors)
 *   403 - Forbidden (authorization errors)
 *   404 - Not Found (resource not found)
 *   410 - Gone (resource permanently deleted)
 *   500 - Internal Server Error (infrastructure errors)
 */
export const LinkErrors = {
  // Validation errors
  LINK_TOKEN_MISSING_ID: {
    status: 400,
    message: 'Invalid link token: missing link ID',
  },

  // Authentication/token errors (from LinkService and auth middleware)
  UNAUTHORIZED: {
    status: 401,
    message: 'You must be logged in to access this resource',
  },
  LINK_TOKEN_EXPIRED: {
    status: 401,
    message: 'Link token has expired',
  },
  LINK_TOKEN_INVALID: {
    status: 401,
    message: 'Invalid link token',
  },

  // Authorization errors (from LinkService and workspace middleware)
  FORBIDDEN: {
    status: 403,
    message: 'Insufficient permissions',
  },
  LINK_DELETE_FORBIDDEN: {
    status: 403,
    message: 'You do not have permission to delete this link',
  },
  LINK_MEMBER_WORKSPACE_MISMATCH: {
    status: 403,
    message: 'Workspace member does not belong to this workspace',
  },
  LINK_WORKSPACE_MISMATCH: {
    status: 403,
    message: 'Link does not belong to this workspace',
  },
  // Not found errors
  LINK_NOT_FOUND: {
    status: 404,
    message: 'Link not found',
  },
  LINK_MEMBER_NOT_FOUND: {
    status: 404,
    message: 'Workspace member not found',
  },
  LINK_DEFAULT_PROJECT_NOT_FOUND: {
    status: 404,
    message: 'No default project found for workspace',
  },

  // Gone errors
  LINK_GONE: {
    status: 410,
    message: 'Link has been deleted',
  },
  LINK_WORKSPACE_DELETED: {
    status: 410,
    message: 'Workspace has been deleted',
  },
  LINK_PROJECT_DELETED: {
    status: 410,
    message: 'Project has been deleted',
  },

  // Infrastructure errors
  LINK_CREATE_FAILED: {
    status: 500,
    message: 'Failed to create link',
  },
  LINK_UPDATE_FAILED: {
    status: 500,
    message: 'Failed to update link',
  },
  LINK_DELETE_FAILED: {
    status: 500,
    message: 'Failed to delete link',
  },
} as const;
