/**
 * Subject for Invite - Teammate Joined Email
 */

const formatMember = (name: string, email: string) => {
  const trimmedName = name?.trim();
  return trimmedName || email;
};

const formatWorkspaceName = (workspaceName: string) => {
  const trimmedWorkspace = workspaceName?.trim();
  return trimmedWorkspace || 'workspace';
};

export const subject = (params: {
  memberName: string;
  memberEmail: string;
  workspaceName: string;
}) =>
  `${formatMember(params.memberName, params.memberEmail)} joined ${formatWorkspaceName(params.workspaceName)}`;
