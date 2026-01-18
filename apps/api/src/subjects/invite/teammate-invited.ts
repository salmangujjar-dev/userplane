/**
 * Subject for Invite - Teammate Invited Email
 */

export const subject = (params: { inviterName: string; workspaceName: string }) =>
  `${params.inviterName} invited you to ${params.workspaceName}`;
