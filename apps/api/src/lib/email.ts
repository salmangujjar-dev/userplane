import { WorkspaceInvitePolicy } from '@userplane/contract';
import { isDisposableEmail } from '@userplane/shared';

export function determineWorkspaceInvitePolicyFromEmail(userEmail: string): {
  workspaceInvitePolicy: WorkspaceInvitePolicy;
  workspaceInviteDomains: string | null;
} {
  // if the email is a disposable email, return 'private'
  if (isDisposableEmail(userEmail)) {
    return {
      workspaceInvitePolicy: 'private',
      workspaceInviteDomains: null,
    };
  }

  // Extract the domain from the email
  const domain = userEmail.split('@')[1]?.toLowerCase();
  if (!domain) {
    return {
      workspaceInvitePolicy: 'private',
      workspaceInviteDomains: null,
    };
  }

  return {
    workspaceInvitePolicy: 'whitelisted',
    workspaceInviteDomains: domain,
  };
}
