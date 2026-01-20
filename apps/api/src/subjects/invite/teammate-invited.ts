/**
 * Subject for Invite - Teammate Invited Email
 */

const formatWorkspaceName = (workspaceName: string) => {
  const trimmedWorkspace = workspaceName?.trim();
  return trimmedWorkspace || 'Userplane workspace';
};

export const subject = (params: { workspaceName: string }) =>
  `You have been invited to ${formatWorkspaceName(params.workspaceName)}`;
