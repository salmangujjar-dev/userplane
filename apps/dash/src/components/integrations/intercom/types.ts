import type { WorkspaceInvitePolicy } from '@/types';

export interface Admin {
  id: string;
  email: string;
  name: string | null;
}

export interface InvitePolicyInfo {
  invitePolicy: WorkspaceInvitePolicy;
  allowedDomains: string[] | null;
}
