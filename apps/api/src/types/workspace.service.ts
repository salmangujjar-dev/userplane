/**
 * Workspace service types
 * Types for workspace creation and management operations
 */

import type { WorkspacePlan, WorkspaceRole, DomainStatus } from './database';

/**
 * Token and authentication types
 * JWT payload structures
 */

/**
 * Invite token payload for JWT
 *
 * Workflow:
 * 1. A simple UUID is stored in workspace.workspaceInviteToken database field
 * 2. When generating an invite link, this UUID is included in a JWT token
 *    along with workspace and inviter context for the invite page
 *
 * Short keys used to minimize JWT token length:
 * - wi: workspace id
 * - wn: workspace name
 * - wt: workspace invite token (UUID from database)
 * - in: inviter name
 * - ie: inviter email
 */
export interface InviteTokenPayload {
  iss: string; // Issuer (JWT standard) - always 'userplane'
  wi: string; // workspaceId
  wn: string; // workspaceName
  wt: string; // workspaceInviteToken
  in: string; // inviterName
  ie: string; // inviterEmail
}

/**
 * Workspace-related types
 * Types for workspace, members, projects, and domains
 */

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

/**
 * Parameters for creating a workspace
 */
export interface CreateWorkspaceParams {
  workspaceName: string;
  recordingSlug?: string;
  workspacePlan: WorkspacePlan;
  userId: string;
}

/**
 * Team member details
 */
export interface TeamMember {
  workspaceMemberId: string;
  memberName: string;
  memberEmail: string;
  workspaceRole: WorkspaceRole;
}

/**
 * Domain details for workspace
 */
export interface DomainItem {
  domainId: string;
  domainUrl: string;
  domainStatus: DomainStatus;
}

/**
 * Request body for adding a domain
 */
export interface AddDomainRequest {
  url: string;
}

/**
 * Request body for updating workspace preferences
 * Note: recordingCompanyLogoPath is excluded as it can only be set via the upload endpoint
 * Note: Recording toggle settings (hideSensitive, captureClientLog, captureServerLog) moved to domain level
 */
export interface UpdateWorkspacePreferencesRequest {
  recordingCustomizeLink?: boolean;
  recordingCompanyName?: string | null;
  recordingHeader?: string | null;
  recordingFootnote?: string | null;
  recordingPrimaryColor?: string | null;
  recordingMaxDurationMs?: number | null;
}

/**
 * Link settings data
 * Note: Recording toggle settings (hideSensitive, captureClientLog, captureServerLog) moved to domain level
 */
export interface LinkSettings {
  workspaceId: string;
  recordingCompanyName: string | null;
  recordingCompanyLogoPath: string | null;
  recordingHeader: string | null;
  recordingFootnote: string | null;
  recordingPrimaryColor: string | null;
  recordingMaxDurationMs: number | null;
  recordingCustomizeLink: boolean;
  recordingSlug: string;
}
