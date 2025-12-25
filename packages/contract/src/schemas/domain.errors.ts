/**
 * Domain errors
 * From DomainService
 */
export const DomainErrors = {
  DOMAIN_URL_REQUIRED: {
    message: 'Domain URL is required',
  },
  DOMAIN_ALREADY_EXISTS: {
    message: 'This domain has already been added to the workspace',
  },
  DOMAIN_NOT_FOUND: {
    message: 'Domain not found',
  },
  DOMAIN_GONE: {
    message: 'Domain has been deleted',
  },
  DOMAIN_WORKSPACE_MISMATCH: {
    message: 'Domain does not belong to this workspace',
  },
  DOMAIN_UPDATE_FAILED: {
    message: 'Failed to update domain',
  },
  DOMAIN_LAST_DOMAIN_DELETE_FORBIDDEN: {
    message: 'Cannot delete the only domain in a workspace',
  },
  DOMAIN_DELETE_FAILED: {
    message: 'Failed to delete domain',
  },
  DOMAIN_VERIFICATION_TOKEN_INVALID: {
    message: 'Invalid verification token',
  },
  DOMAIN_NOT_REGISTERED: {
    message: 'Domain is not registered for this workspace',
  },
  DOMAIN_URL_INVALID: {
    message: 'Invalid stored domain URL',
  },
  DOMAIN_ORIGIN_INVALID: {
    message: 'Invalid origin hostname',
  },
  DOMAIN_ORIGIN_MISMATCH: {
    message: 'Origin does not match registered domain',
  },
  DOMAIN_VERIFICATION_FAILED: {
    message: 'Failed to verify domain',
  },
  DOMAIN_UNVERIFIED: {
    message:
      'Cannot update recording preferences for unverified domain. Please verify the domain first.',
  },
  DOMAIN_PREFERENCES_UPDATE_FAILED: {
    message: 'Failed to update domain preferences',
  },
  UNAUTHORIZED: {
    message: 'You must be logged in to access this resource',
  },
  FORBIDDEN: {
    message: 'Insufficient permissions',
  },
  INTERNAL_SERVER_ERROR: {
    message: 'Internal server error',
  },
} as const;
