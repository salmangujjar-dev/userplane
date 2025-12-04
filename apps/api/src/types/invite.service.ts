/**
 * Invite service types
 * Types for workspace invitation operations
 */

/**
 * Parameters for sending workspace invitations
 */
export interface SendInvitesParams {
  workspaceId: string;
  emails: string[];
  invitedBy: string;
}

/**
 * Result of sending workspace invitations
 */
export interface SendInvitesResult {
  sent: string[];
  failed: Array<{ email: string; reason: string }>;
}

/**
 * Parameters for accepting a workspace invitation
 */
export interface AcceptInviteParams {
  inviteToken: string;
  userId: string;
}

/**
 * Result of accepting a workspace invitation
 */
export interface AcceptInviteResult {
  workspace: {
    workspaceName: string;
    workspaceId: string;
  };
}

/**
 * Result of validating or accepting an invite
 * Used for unified invite action endpoint
 */
export interface InviteActionResult {
  status: 'valid' | 'accepted' | 'invalid' | 'expired' | 'already_member';
  workspaceId?: string;
  workspaceName?: string;
  inviterName?: string;
  inviterEmail?: string;
  message?: string;
}
