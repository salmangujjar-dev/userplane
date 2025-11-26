/**
 * Token and authentication types
 * JWT payload structures
 */

/**
 * Invite token payload
 * Contains all data needed to render invite page and accept invitation
 */
export interface InviteTokenPayload {
  workspaceId: string;
  workspaceName: string;
  workspaceInviteToken: string;
  inviterName: string;
  inviterEmail: string;
}

/**
 * Workspace invite token payload
 * Simpler token stored in workspace.workspaceInviteToken field
 */
export interface WorkspaceInviteTokenPayload {
  workspaceSlug: string;
  createdBy: string;
}
