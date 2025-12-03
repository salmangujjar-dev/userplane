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
  recordingSlug: string;
  workspacePlan: WorkspacePlan;
  userId: string;
}

/**
 * Result after rotating workspace invite URL
 */
export interface RotateInviteUrlResult {
  workspaceId: string;
  recordingSlug: string;
  message: string;
}

/**
 * Result containing workspace invite URL
 */
export interface GetInviteUrlResult {
  inviteUrl: string;
  workspaceId: string;
  recordingSlug: string;
}
