/**
 * Invite API Data Types
 * Data types for invite-related API responses
 */

export interface InviteUrlData {
  inviteUrl: string;
  workspaceId: string;
}

export interface InviteSendData {
  workspaceId: string;
  sent: string[];
  failed: string[];
}

export interface InviteValidateData {
  workspaceName: string;
  inviterName: string;
  inviterEmail: string;
}

export interface InviteAcceptData {
  workspaceId: string;
  workspaceName: string;
}
