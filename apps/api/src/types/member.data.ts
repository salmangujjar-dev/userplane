/**
 * Member API Data Types
 * Data types for team/member-related API responses
 */

import type { PaginationMeta } from './common';
import type { TeamMember } from './workspace.service';
import type { WorkspaceRole } from './database';

export interface WorkspaceTeamData {
  workspaceId: string;
  workspaceMembers: TeamMember[];
  workspaceMembership?: WorkspaceMembershipData;
  pagination: PaginationMeta;
}

export interface WorkspaceMembershipData {
  workspaceMemberId: string;
  workspaceRole: WorkspaceRole;
}

export interface MemberRoleUpdateData {
  workspaceMemberId: string;
  workspaceRole: WorkspaceRole;
}

export interface MemberRemoveData {
  workspaceMemberId: string;
}
