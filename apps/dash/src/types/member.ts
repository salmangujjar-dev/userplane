/**
 * Workspace member-related types
 */

import type { WorkspaceRole } from '@workspace/contract';
import type { PaginationMeta } from './common';

/**
 * Workspace member role
 */

/**
 * Workspace member
 */
export interface WorkspaceMember {
  workspaceMemberId: string;
  userName: string;
  userEmail: string;
  workspaceRole: WorkspaceRole;
}

/**
 * Members list response
 */
export interface MembersListResponse {
  workspaceId: string;
  workspaceMembers: WorkspaceMember[];
  pagination: PaginationMeta;
}
