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
  workspaceLogoUrl?: string | null;
  userId: string;
}
