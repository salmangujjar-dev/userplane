/**
 * Copy for Auth - Workspace Invite Email
 */

export const copy = {
  preview: (inviterName: string, workspaceName: string) =>
    `${inviterName} invited you to ${workspaceName}`,
  title: 'You have been invited',
  body: [
    (inviterName: string, workspaceName: string) =>
      `${inviterName} has invited you to join ${workspaceName} on Userplane.`,
    'Accept the invitation to start viewing recordings, creating recording links, and collaborating with your team.',
  ],
  cta: 'Accept invitation',
  fallbackText: 'Or copy this link:',
  footer: 'If you did not expect this invitation, you can safely ignore this email.',
} as const;
