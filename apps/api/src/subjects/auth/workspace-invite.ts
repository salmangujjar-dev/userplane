/**
 * Subject for Auth - Workspace Invite Email
 */

export const subject = (params: { inviterName: string; workspaceName: string }) =>
  `${params.inviterName} invited you to ${params.workspaceName}`;
