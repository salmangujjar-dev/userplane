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
  wi: string; // workspaceId
  wn: string; // workspaceName
  wt: string; // workspaceInviteToken
  in: string; // inviterName
  ie: string; // inviterEmail
}
