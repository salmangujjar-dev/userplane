/**
 * Domain errors
 * From DomainService, auth middleware, workspace middleware, and route implementations
 * Status codes follow HTTP semantics and match actual service implementation:
 *   400 - Bad Request (validation, format errors)
 *   401 - Unauthorized (authentication errors)
 *   403 - Forbidden (authorization, permission errors)
 *   404 - Not Found (resource not found)
 *   409 - Conflict (resource already exists)
 *   410 - Gone (resource permanently deleted)
 *   500 - Internal Server Error (infrastructure errors)
 */
export const DomainErrors = {
  // Validation errors
  DOMAIN_URL_REQUIRED: {
    status: 400,
    message: 'Domain URL is required',
  },
  DOMAIN_URL_INVALID: {
    status: 400,
    message: 'Invalid stored domain URL',
  },
  DOMAIN_ORIGIN_INVALID: {
    status: 400,
    message: 'Invalid origin hostname',
  },

  // Authentication/token errors (from auth middleware and service)
  UNAUTHORIZED: {
    status: 401,
    message: 'You must be logged in to access this resource',
  },
  DOMAIN_VERIFICATION_TOKEN_INVALID: {
    status: 401,
    message: 'Invalid verification token',
  },

  // Authorization errors (from workspace middleware and service)
  FORBIDDEN: {
    status: 403,
    message: 'Insufficient permissions',
  },
  DOMAIN_WORKSPACE_MISMATCH: {
    status: 403,
    message: 'Domain does not belong to this workspace',
  },
  DOMAIN_ORIGIN_MISMATCH: {
    status: 403,
    message: 'Origin does not match registered domain',
  },
  DOMAIN_LAST_DOMAIN_DELETE_FORBIDDEN: {
    status: 403,
    message: 'Cannot delete the only domain in a workspace',
  },
  DOMAIN_UNVERIFIED: {
    status: 403,
    message:
      'Cannot update recording preferences for unverified domain. Please verify the domain first.',
  },

  // Not found errors
  DOMAIN_NOT_FOUND: {
    status: 404,
    message: 'Domain not found',
  },
  DOMAIN_NOT_REGISTERED: {
    status: 404,
    message: 'Domain is not registered for this workspace',
  },

  // Conflict errors
  DOMAIN_ALREADY_EXISTS: {
    status: 409,
    message: 'This domain has already been added to the workspace',
  },

  // Gone errors
  DOMAIN_GONE: {
    status: 410,
    message: 'Domain has been deleted',
  },

  // Infrastructure errors (from service and route implementations)
  DOMAIN_CREATE_FAILED: {
    status: 500,
    message: 'Failed to create domain',
  },
  DOMAIN_UPDATE_FAILED: {
    status: 500,
    message: 'Failed to update domain',
  },
  DOMAIN_DELETE_FAILED: {
    status: 500,
    message: 'Failed to delete domain',
  },
  DOMAIN_VERIFICATION_FAILED: {
    status: 500,
    message: 'Failed to verify domain',
  },
  DOMAIN_PREFERENCES_UPDATE_FAILED: {
    status: 500,
    message: 'Failed to update domain preferences',
  },
  INTERNAL_SERVER_ERROR: {
    status: 500,
    message: 'Internal server error',
  },
} as const;
