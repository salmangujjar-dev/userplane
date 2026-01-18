/**
 * Copy for Invite - Teammate Joined Email
 */

const formatMember = (name: string, email: string) => {
  const trimmedName = name?.trim();
  return trimmedName || email;
};

const formatWorkspaceName = (workspaceName: string) => {
  const trimmedWorkspace = workspaceName?.trim();
  return trimmedWorkspace || 'workspace';
};

export const copy = {
  preview: (memberName: string, memberEmail: string, workspaceName: string) =>
    `${formatMember(memberName, memberEmail)} joined ${formatWorkspaceName(workspaceName)}`,
  title: 'New team member',
  subtitle: (memberName: string, memberEmail: string, workspaceName: string) =>
    `${formatMember(memberName, memberEmail)} has joined ${formatWorkspaceName(workspaceName)}`,
  body: [
    'They now have access to view recordings, create recording links, and collaborate with your team.',
  ],
  cta: 'View workspace',
} as const;
