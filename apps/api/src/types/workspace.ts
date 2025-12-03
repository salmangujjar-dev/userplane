/**
 * Workspace-related types
 * Types for workspace, members, projects, stores, and domains
 */

import type { WorkspacePlan, WorkspaceRole, DomainStatus } from './database';

/**
 * Workspace creation input
 */
export interface CreateWorkspaceInput {
  id: string;
  workspaceName: string;
  recordingSlug: string;
  workspacePlan: WorkspacePlan;
  workspaceInviteToken: string;
}

/**
 * Workspace member creation input
 */
export interface CreateWorkspaceMemberInput {
  id: string;
  userId: string;
  workspaceId: string;
  workspaceRole: WorkspaceRole;
}

/**
 * Project creation input
 */
export interface CreateProjectInput {
  id: string;
  workspaceId: string;
  projectTitle: string | null;
  projectPath: string;
  isDefault: boolean;
}

/**
 * Domain creation input
 */
export interface CreateDomainInput {
  id: string;
  workspaceId: string;
  url: string;
  domainStatus: DomainStatus;
}

/**
 * Workspace response (simplified for API)
 */
export interface WorkspaceResponse {
  recordingSlug: string;
  workspaceName: string;
  workspaceInviteToken: string; // Always present, never null
}
