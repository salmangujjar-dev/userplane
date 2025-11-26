/**
 * Workspace service types
 * Types for workspace creation and management operations
 */

import type { WorkspacePlan } from './database';

/**
 * Parameters for creating a workspace
 */
export interface CreateWorkspaceParams {
  workspaceName: string;
  workspaceSlug: string;
  workspacePlan: WorkspacePlan;
  workspaceLogoUrl: string;
  userId: string;
}

/**
 * Result after rotating workspace invite URL
 */
export interface RotateInviteUrlResult {
  workspaceId: string;
  workspaceSlug: string;
  message: string;
}

/**
 * Result containing workspace invite URL
 */
export interface GetInviteUrlResult {
  inviteUrl: string;
  workspaceId: string;
  workspaceSlug: string;
}
