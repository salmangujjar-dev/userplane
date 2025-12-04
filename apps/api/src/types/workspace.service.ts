/**
 * Workspace service types
 * Types for workspace creation and management operations
 */

import type { WorkspacePlan, WorkspaceRole, DomainStatus } from './database';
import type { PaginationMeta } from './common';

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
 * Result after rotating workspace invite URL
 */
export interface RotateInviteUrlResult {
  workspaceId: string;
  message: string;
}

/**
 * Result containing workspace invite URL
 */
export interface GetInviteUrlResult {
  inviteUrl: string;
  workspaceId: string;
}

/**
 * Team member details
 */
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: WorkspaceRole;
}

/**
 * Result containing workspace team members with pagination
 */
export interface GetWorkspaceTeamResult {
  workspaceId: string;
  members: TeamMember[];
  pagination: PaginationMeta;
}

/**
 * Domain details for workspace
 */
export interface DomainItem {
  url: string;
  status: DomainStatus;
}

/**
 * Result containing workspace domains
 */
export interface GetWorkspaceDomainsResult {
  workspaceId: string;
  domains: DomainItem[];
}

/**
 * Request body for adding a domain
 */
export interface AddDomainRequest {
  url: string;
}

/**
 * Result after adding a domain
 */
export interface AddDomainResult {
  workspaceId: string;
  domain: DomainItem;
  message: string;
}

/**
 * Request body for updating workspace preferences
 */
export interface UpdateWorkspacePreferencesRequest {
  recordingCustomizeLink?: boolean;
  recordingHideSensitive?: boolean;
  recordingCaptureClientLog?: boolean;
  recordingCaptureServerLog?: boolean;
  recordingCompanyName?: string | null;
  recordingCompanyLogoPath?: string | null;
  recordingHeader?: string | null;
  recordingFootnote?: string | null;
  recordingPrimaryColor?: string | null;
  recordingMaxDuration?: number | null;
}

/**
 * Result after updating workspace preferences
 */
export interface UpdateWorkspacePreferencesResult {
  workspaceId: string;
  message: string;
}
