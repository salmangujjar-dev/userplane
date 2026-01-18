/**
 * Subject for Invite - Teammate Invited Email
 */

const formatInviter = (name: string, email: string) => {
  const trimmedName = name?.trim();
  return trimmedName || email;
};

const formatWorkspaceName = (workspaceName: string) => {
  const trimmedWorkspace = workspaceName?.trim();
  return trimmedWorkspace || 'workspace';
};

export const subject = (params: {
  inviterName: string;
  inviterEmail: string;
  workspaceName: string;
}) =>
  `${formatInviter(params.inviterName, params.inviterEmail)} invited you to ${formatWorkspaceName(params.workspaceName)}`;
