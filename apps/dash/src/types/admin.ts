/**
 * Admin-related types
 * Re-exports from @workspace/contract + frontend-specific types
 */

import type { WorkspaceRole } from '@workspace/contract';

// Re-export all admin types from contract
export type {
  // User input types (API shapes)
  AdminBanUserInput,
  AdminCreateWorkspaceInviteData,
  AdminCreateWorkspaceInviteInput,
  AdminDeactivateProjectData,
  AdminDeactivateProjectInput,
  AdminDeactivateWorkspaceInput,
  AdminGetUserInput,
  AdminGetWorkspaceInput,
  AdminGetWorkspaceRecordingStatsInput,
  AdminListUserSessionsInput,
  AdminListUserWorkspacesInput,
  AdminListWorkspaceMembersInput,
  AdminListWorkspaceProjectsInput,
  // Constants/enums
  AdminNotifyDuration,
  // Recording stats
  AdminRecordingWeeklyStat,
  AdminResetInviteTokenInput,
  AdminRestoreProjectData,
  AdminRestoreProjectInput,
  // Response data types
  AdminRestoreWorkspaceData,
  AdminRestoreWorkspaceInput,
  AdminRevokeAllSessionsInput,
  AdminRevokeSessionInput,
  AdminSearchUsersInput,
  // Workspace input types
  AdminSearchWorkspacesInput,
  AdminUnbanUserInput,
  AdminUserDetail,
  // User types
  AdminUserListItem,
  AdminUserSession,
  AdminUserSessionsData,
  AdminUsersListData,
  AdminUserWorkspace,
  AdminUserWorkspacesData,
  AdminWorkspaceDetail,
  // Workspace types
  AdminWorkspaceListItem,
  AdminWorkspaceMember,
  AdminWorkspaceMembersListData,
  AdminWorkspaceProject,
  AdminWorkspaceProjectsListData,
  AdminWorkspaceRecordingStats,
  AdminWorkspacesListData,
} from '@workspace/contract';

// ============================================
// FRONTEND-SPECIFIC TYPES
// ============================================
// These flatten API request shapes (params + body) for hook inputs

/**
 * Ban user input for useAdminBanUser hook
 * Contract equivalent: AdminBanUserInput (nested body structure)
 * Flattened for hook convenience
 */
export interface BanUserInput {
  userId: string;
  reason: string;
  expiresInSeconds?: number;
  deleteWorkspacesForRoles?: WorkspaceRole[];
}

/**
 * Create workspace invite input for useAdminCreateWorkspaceInvite hook
 * Contract equivalent: AdminCreateWorkspaceInviteInput (nested body structure)
 * Flattened for hook convenience - uses same field names as contract body
 */
export interface AdminWorkspaceCreateInviteInput {
  workspaceUrl: string;
  notify?: 'never' | 'immediate' | '5m' | '15m' | '30m' | '60m';
  email?: string;
}

/**
 * Impersonate user params for useImpersonation hook
 * Contract equivalent: None (handled by Better Auth directly)
 * Frontend-specific for the impersonation hook
 */
export interface ImpersonateUserParams {
  userId: string;
  userName?: string;
}
