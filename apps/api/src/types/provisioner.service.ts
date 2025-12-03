/**
 * Provisioner service types
 * Types for workspace provisioning orchestration
 */

/**
 * Parameters for provisioning a new workspace
 */
export interface ProvisionWorkspaceParams {
  url: string;
  userId: string;
}

/**
 * Result of workspace provisioning
 */
export interface ProvisionWorkspaceResult {
  workspace: {
    recordingSlug: string;
    workspaceName: string;
    workspaceInviteToken: string;
  };
}
