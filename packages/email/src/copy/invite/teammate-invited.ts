/**
 * Copy for Invite - Teammate Invited Email
 */

const formatWorkspaceName = (workspaceName: string) => {
  const trimmedWorkspace = workspaceName?.trim();
  return trimmedWorkspace || 'Userplane workspace';
};

export const copy = {
  preview: (workspaceName: string) =>
    `You have been invited to ${formatWorkspaceName(workspaceName)}`,
  title: 'You have been invited',
  subtitle: (workspaceName: string) =>
    `You have been invited to ${formatWorkspaceName(workspaceName)}`,
  body: [
    'Request and replay customer issues without the back-and-forth. Join your team and get started with Userplane immediately.',
  ],
  cta: 'Accept invitation',
  fallbackText: 'Or copy this link:',
} as const;
