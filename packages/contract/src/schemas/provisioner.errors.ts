/**
 * Provisioner errors
 * From workspace provisioning (ProvisionerService, WorkspaceService, DomainService, WorkspaceMemberService)
 */
export const ProvisionerErrors = {
  PROVISIONER_WORKSPACE_CREATE_FAILED: {
    message: 'Failed to create workspace',
  },
  PROVISIONER_TRANSACTION_FAILED: {
    message: 'Transaction failed',
  },
} as const;
