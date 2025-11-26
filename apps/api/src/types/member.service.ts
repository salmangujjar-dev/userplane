/**
 * Workspace member service types
 * Types for workspace membership and role management operations
 */

import type { WorkspaceRole } from './database';

/**
 * Parameters for adding a workspace owner
 */
export interface AddOwnerParams {
  userId: string;
  workspaceId: string;
}

/**
 * Parameters for adding a workspace member
 */
export interface AddMemberParams {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
}

/**
 * Parameters for updating member role
 */
export interface UpdateRoleParams {
  memberId: string;
  newRole: WorkspaceRole;
}
