/**
 * Intercom Canvas Kit errors
 * From IntercomCanvasService and signature verification middleware
 * Status codes follow HTTP semantics:
 *   400 - Bad Request (validation errors)
 *   401 - Unauthorized (signature verification failed)
 *   403 - Forbidden (authorization errors)
 *   404 - Not Found (resource not found)
 *   500 - Internal Server Error (infrastructure errors)
 */
export const IntercomErrors = {
  // Authentication errors
  INTERCOM_INVALID_SIGNATURE: {
    status: 401,
    message: 'Invalid request signature',
  },
  INTERCOM_MISSING_SIGNATURE: {
    status: 401,
    message: 'Missing X-Body-Signature header',
  },

  // Authorization errors
  INTERCOM_ADMIN_NOT_MEMBER: {
    status: 403,
    message: 'Admin is not a member of the workspace',
  },
  INTERCOM_RECORDING_LIMIT_EXCEEDED: {
    status: 403,
    message: 'Recording limit exceeded for your plan',
  },

  // Not found errors
  INTERCOM_INTEGRATION_NOT_FOUND: {
    status: 404,
    message: 'Intercom integration not found',
  },
  INTERCOM_WORKSPACE_NOT_FOUND: {
    status: 404,
    message: 'Workspace not found',
  },
  INTERCOM_PROJECT_NOT_FOUND: {
    status: 404,
    message: 'Project not found',
  },
  INTERCOM_DOMAIN_NOT_FOUND: {
    status: 404,
    message: 'Domain not found',
  },
  INTERCOM_USER_NOT_FOUND: {
    status: 404,
    message: 'User not found',
  },

  // Infrastructure errors
  INTERCOM_LINK_CREATE_FAILED: {
    status: 500,
    message: 'Failed to create recording link',
  },
  INTERCOM_CANVAS_ERROR: {
    status: 500,
    message: 'An error occurred while processing the canvas request',
  },
} as const;
