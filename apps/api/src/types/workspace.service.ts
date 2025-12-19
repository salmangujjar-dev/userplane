/**
 * Workspace service types
 * Types for workspace creation and management operations
 */

import type { WorkspaceRole, DomainStatus } from '@workspace/contract';
import type { PlanId as WorkspacePlan } from '@workspace/pricing';

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
 * Domain verification token payload for JWT
 * Used by recorder script to verify domain ownership
 */
export interface DomainVerificationTokenPayload {
  iss: string; // Issuer
  workspaceId: string;
  domainId: string;
  url: string;
  iat: number; // Issued at
  exp: number; // Expiry
}

/**
 * Session token payload for recording sessions
 * Short keys used to minimize JWT token length
 */
export interface SessionTokenPayload {
  iss: string; // Issuer
  lid: string; // Link ID
  lt: string; // Link Type
  wid: string; // Workspace ID
  sid: string; // Session ID
  prefs: SessionPreferences; // Session preferences
  iat: number; // Issued at
  exp: number; // Expiry
}

/**
 * Upload token payload for file uploads
 * Short keys used to minimize JWT token length
 */
export interface UploadTokenPayload {
  iss: string; // Issuer
  rid: string; // Recording ID
  lid: string; // Link ID
  lt: 'recording'; // Link Type
  iat: number; // Issued at
  exp: number; // Expiry
}

/**
 * Session preferences from link and workspace settings
 * Short keys used to minimize JWT token length
 */
export interface SessionPreferences {
  rcl: boolean; // recording_customize_link
  rhs: boolean; // recording_hide_sensitive
  rccl: boolean; // recording_capture_client_log
  rcsl: boolean; // recording_capture_server_log
  rcnl: boolean; // recording_capture_network_log
  rcn: string | null; // recording_company_name
  rclp: string | null; // recording_company_logo_path
  rh: string | null; // recording_header
  rf: string | null; // recording_footnote
  rpc: string | null; // recording_primary_color
  rmd: number | null; // recording_max_duration_ms
  rrb: string; // recording_requested_by (creator name)
}

/**
 * Presigned URL info for file uploads
 */
export interface PresignedUrlInfo {
  type: UploadFileType;
  url: string;
  expiresIn: number;
}

/**
 * Upload file type enum
 */
export type UploadFileType = 'video' | 'thumbnail' | 'console_log' | 'network_log';

/**
 * Workspace-related types
 * Types for workspace, members, projects, and domains
 */

/**
 * Workspace creation input
 */
export interface CreateWorkspaceInput {
  workspaceId: string;
  workspaceName: string;
  recordingSlug: string;
  workspacePlan: WorkspacePlan;
  workspaceInviteToken: string;
}

/**
 * Workspace member creation input
 */
export interface CreateWorkspaceMemberInput {
  workspaceMemberId: string;
  userId: string;
  workspaceId: string;
  workspaceRole: WorkspaceRole;
}

/**
 * Project creation input
 */
export interface CreateProjectInput {
  projectId: string;
  workspaceId: string;
  projectTitle: string | null;
  isDefault: boolean;
}

/**
 * Domain creation input
 */
export interface CreateDomainInput {
  domainId: string;
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
