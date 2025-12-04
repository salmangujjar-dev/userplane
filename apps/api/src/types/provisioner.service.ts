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
  userName?: string;
}

/**
 * Result of workspace provisioning
 */
export interface ProvisionWorkspaceResult {
  workspaceId: string;
}
