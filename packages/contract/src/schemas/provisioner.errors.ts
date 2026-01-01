/**
 * Provisioner errors
 * From workspace provisioning (ProvisionerService, WorkspaceService, DomainService, WorkspaceMemberService)
 * Status codes follow HTTP semantics and match actual service implementation:
 *   401 - Unauthorized (authentication errors)
 *   500 - Internal Server Error (infrastructure errors)
 */
export const ProvisionerErrors = {
  // Authentication errors (from auth middleware)
  UNAUTHORIZED: {
    status: 401,
    message: 'You must be logged in to access this resource',
  },

  // Infrastructure errors
  PROVISIONER_WORKSPACE_CREATE_FAILED: {
    status: 500,
    message: 'Failed to create workspace',
  },
  PROVISIONER_TRANSACTION_FAILED: {
    status: 500,
    message: 'Transaction failed',
  },
} as const;
