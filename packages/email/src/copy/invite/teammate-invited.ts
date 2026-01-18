/**
 * Copy for Invite - Teammate Invited Email
 */

const formatInviter = (name: string, email: string) => {
  const trimmedName = name?.trim();
  return trimmedName || email;
};

const formatWorkspaceName = (workspaceName: string) => {
  const trimmedWorkspace = workspaceName?.trim();
  return trimmedWorkspace || 'workspace';
};

export const copy = {
  preview: (inviterName: string, inviterEmail: string, workspaceName: string) =>
    `${formatInviter(inviterName, inviterEmail)} invited you to ${formatWorkspaceName(workspaceName)}`,
  title: 'You have been invited',
  subtitle: (inviterName: string, inviterEmail: string, workspaceName: string) =>
    `${formatInviter(inviterName, inviterEmail)} invited you to join ${formatWorkspaceName(workspaceName)}`,
  body: [
    'Accept this invitation to start viewing recordings, creating recording links, and collaborating with your team.',
  ],
  cta: 'Accept invitation',
  helpText: 'Or copy this link:',
} as const;
