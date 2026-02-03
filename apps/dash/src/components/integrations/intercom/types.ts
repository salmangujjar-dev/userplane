import type { WorkspaceInvitePolicy } from '@/types';

export interface Teammate {
  id: string;
  email: string;
  name: string | null;
}

export interface InvitePolicyInfo {
  invitePolicy: WorkspaceInvitePolicy;
  allowedDomains: string[] | null;
}
