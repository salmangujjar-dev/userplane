/**
 * Workspace-related types
 * Types for workspace, members, projects, stores, and domains
 */

import type { WorkspacePlan, WorkspaceRole, DomainStatus, StoreProvider } from './database';

/**
 * Workspace creation input
 */
export interface CreateWorkspaceInput {
  id: string;
  workspaceName: string;
  workspaceSlug: string;
  workspacePlan: WorkspacePlan;
  workspaceLogoUrl: string;
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
  storeId: string;
  projectTitle: string | null;
  projectPath: string;
  isDefault: boolean;
}

/**
 * Store creation input
 */
export interface CreateStoreInput {
  id: string;
  workspaceId: string;
  storeTitle: string;
  provider: StoreProvider;
  providerUrl: string;
  providerRegion: string;
  providerBucket: string;
  providerAccessId: string;
  providerAccessKey: string;
  storeIsManaged: boolean;
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
  workspaceSlug: string;
  workspaceName: string;
  workspaceInviteToken: string; // Always present, never null
  workspaceLogoUrl: string;
}
