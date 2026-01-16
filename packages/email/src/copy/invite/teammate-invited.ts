/**
 * Copy for Invite - Teammate Invited Email
 */

export const copy = {
  preview: (inviterName: string, workspaceName: string) =>
    `${inviterName} invited you to ${workspaceName}`,
  title: 'You have been invited',
  subtitle: (inviterName: string, workspaceName: string) =>
    `${inviterName} invited you to join ${workspaceName}`,
  body: [
    'Accept this invitation to start viewing recordings, creating recording links, and collaborating with your team.',
  ],
  cta: 'Accept invitation',
  helpText: 'Or copy this link:',
  ps: 'This invitation expires in 7 days.',
} as const;
