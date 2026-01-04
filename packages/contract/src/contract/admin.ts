import { oc } from '@orpc/contract';
import {
  AdminUsersListDataSchema,
  AdminUserDetailSchema,
  AdminSearchUsersInputSchema,
  AdminGetUserInputSchema,
  AdminBanUserInputSchema,
  AdminUnbanUserInputSchema,
  AdminListUserSessionsInputSchema,
  AdminRevokeSessionInputSchema,
  AdminRevokeAllSessionsInputSchema,
  AdminUserSessionsDataSchema,
  AdminWorkspacesListDataSchema,
  AdminWorkspaceDetailSchema,
  AdminWorkspaceMembersListDataSchema,
  AdminSearchWorkspacesInputSchema,
  AdminGetWorkspaceInputSchema,
  AdminListWorkspaceMembersInputSchema,
  AdminDeactivateWorkspaceInputSchema,
  AdminReactivateWorkspaceInputSchema,
  AdminResetInviteTokenInputSchema,
  AdminWorkspaceRecordingStatsSchema,
  AdminGetWorkspaceRecordingStatsInputSchema,
  AdminWorkspaceMemberRecordingStatsSchema,
  AdminGetWorkspaceMemberRecordingStatsInputSchema,
  ApiResponseSchema,
  AdminErrors,
} from '../schemas';

/**
 * Admin contract
 * Endpoints for admin user management operations
 */

/**
 * GET /admin/users
 * Search and list users with workspace and session counts
 */
export const searchUsers = oc
  .route({
    method: 'GET',
    path: '/admin/users',
    inputStructure: 'detailed',
    summary: 'Search users',
    description: 'Search and list all users with workspace and session counts',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
  })
  .input(AdminSearchUsersInputSchema)
  .output(ApiResponseSchema(AdminUsersListDataSchema));

/**
 * GET /admin/users/:userId
 * Get user details with workspaces and sessions
 */
export const getUser = oc
  .route({
    method: 'GET',
    path: '/admin/users/{userId}',
    inputStructure: 'detailed',
    summary: 'Get user details',
    description: 'Get detailed user information including workspaces and sessions',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
    USER_NOT_FOUND: AdminErrors.USER_NOT_FOUND,
  })
  .input(AdminGetUserInputSchema)
  .output(ApiResponseSchema(AdminUserDetailSchema));

/**
 * POST /admin/users/:userId/ban
 * Ban a user
 */
export const banUser = oc
  .route({
    method: 'POST',
    path: '/admin/users/{userId}/ban',
    inputStructure: 'detailed',
    summary: 'Ban user',
    description: 'Ban a user with optional reason and expiration',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
    USER_NOT_FOUND: AdminErrors.USER_NOT_FOUND,
    CANNOT_BAN_SELF: AdminErrors.CANNOT_BAN_SELF,
    CANNOT_BAN_ADMIN: AdminErrors.CANNOT_BAN_ADMIN,
    INVALID_BAN_DURATION: AdminErrors.INVALID_BAN_DURATION,
  })
  .input(AdminBanUserInputSchema)
  .output(ApiResponseSchema(AdminUserDetailSchema));

/**
 * POST /admin/users/:userId/unban
 * Unban a user
 */
export const unbanUser = oc
  .route({
    method: 'POST',
    path: '/admin/users/{userId}/unban',
    inputStructure: 'detailed',
    summary: 'Unban user',
    description: 'Remove ban from a user',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
    USER_NOT_FOUND: AdminErrors.USER_NOT_FOUND,
  })
  .input(AdminUnbanUserInputSchema)
  .output(ApiResponseSchema(AdminUserDetailSchema));

/**
 * GET /admin/users/:userId/sessions
 * List user sessions
 */
export const listUserSessions = oc
  .route({
    method: 'GET',
    path: '/admin/users/{userId}/sessions',
    inputStructure: 'detailed',
    summary: 'List user sessions',
    description: 'Get all sessions for a user',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
    USER_NOT_FOUND: AdminErrors.USER_NOT_FOUND,
  })
  .input(AdminListUserSessionsInputSchema)
  .output(ApiResponseSchema(AdminUserSessionsDataSchema));

/**
 * DELETE /admin/sessions/:sessionId
 * Revoke a specific session
 */
export const revokeSession = oc
  .route({
    method: 'DELETE',
    path: '/admin/sessions/{sessionId}',
    inputStructure: 'detailed',
    summary: 'Revoke session',
    description: 'Revoke a specific user session',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
    SESSION_NOT_FOUND: AdminErrors.SESSION_NOT_FOUND,
  })
  .input(AdminRevokeSessionInputSchema)
  .output(
    ApiResponseSchema(
      AdminUserSessionsDataSchema.pick({ sessions: true }).extend({
        revoked: AdminRevokeSessionInputSchema.shape.params.shape.sessionId,
      })
    )
  );

/**
 * DELETE /admin/users/:userId/sessions
 * Revoke all sessions for a user
 */
export const revokeAllSessions = oc
  .route({
    method: 'DELETE',
    path: '/admin/users/{userId}/sessions',
    inputStructure: 'detailed',
    summary: 'Revoke all user sessions',
    description: 'Revoke all sessions for a user',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
    USER_NOT_FOUND: AdminErrors.USER_NOT_FOUND,
  })
  .input(AdminRevokeAllSessionsInputSchema)
  .output(ApiResponseSchema(AdminUserSessionsDataSchema));

// ============================================
// WORKSPACE MANAGEMENT
// ============================================

/**
 * GET /admin/workspaces
 * Search and list workspaces with entity counts
 */
export const searchWorkspaces = oc
  .route({
    method: 'GET',
    path: '/admin/workspaces',
    inputStructure: 'detailed',
    summary: 'Search workspaces',
    description: 'Search and list all workspaces with entity counts',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
  })
  .input(AdminSearchWorkspacesInputSchema)
  .output(ApiResponseSchema(AdminWorkspacesListDataSchema));

/**
 * GET /admin/workspaces/:workspaceId
 * Get workspace details
 */
export const getWorkspace = oc
  .route({
    method: 'GET',
    path: '/admin/workspaces/{workspaceId}',
    inputStructure: 'detailed',
    summary: 'Get workspace details',
    description: 'Get detailed workspace information with entity counts',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
    WORKSPACE_NOT_FOUND: AdminErrors.WORKSPACE_NOT_FOUND,
  })
  .input(AdminGetWorkspaceInputSchema)
  .output(ApiResponseSchema(AdminWorkspaceDetailSchema));

/**
 * GET /admin/workspaces/:workspaceId/members
 * List workspace members with pagination
 */
export const listWorkspaceMembers = oc
  .route({
    method: 'GET',
    path: '/admin/workspaces/{workspaceId}/members',
    inputStructure: 'detailed',
    summary: 'List workspace members',
    description: 'Get paginated list of workspace members',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
    WORKSPACE_NOT_FOUND: AdminErrors.WORKSPACE_NOT_FOUND,
  })
  .input(AdminListWorkspaceMembersInputSchema)
  .output(ApiResponseSchema(AdminWorkspaceMembersListDataSchema));

/**
 * POST /admin/workspaces/:workspaceId/deactivate
 * Deactivate (soft delete) a workspace
 */
export const deactivateWorkspace = oc
  .route({
    method: 'POST',
    path: '/admin/workspaces/{workspaceId}/deactivate',
    inputStructure: 'detailed',
    summary: 'Deactivate workspace',
    description: 'Soft delete a workspace',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
    WORKSPACE_NOT_FOUND: AdminErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_ALREADY_DEACTIVATED: AdminErrors.WORKSPACE_ALREADY_DEACTIVATED,
  })
  .input(AdminDeactivateWorkspaceInputSchema)
  .output(ApiResponseSchema(AdminWorkspaceDetailSchema));

/**
 * POST /admin/workspaces/:workspaceId/reactivate
 * Reactivate (restore) a workspace
 */
export const reactivateWorkspace = oc
  .route({
    method: 'POST',
    path: '/admin/workspaces/{workspaceId}/reactivate',
    inputStructure: 'detailed',
    summary: 'Reactivate workspace',
    description: 'Restore a deactivated workspace',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
    WORKSPACE_NOT_FOUND: AdminErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_NOT_DEACTIVATED: AdminErrors.WORKSPACE_NOT_DEACTIVATED,
  })
  .input(AdminReactivateWorkspaceInputSchema)
  .output(ApiResponseSchema(AdminWorkspaceDetailSchema));

/**
 * POST /admin/workspaces/:workspaceId/reset-invite-token
 * Reset workspace invite token
 */
export const resetInviteToken = oc
  .route({
    method: 'POST',
    path: '/admin/workspaces/{workspaceId}/reset-invite-token',
    inputStructure: 'detailed',
    summary: 'Reset invite token',
    description: 'Generate a new invite token for a workspace',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
    WORKSPACE_NOT_FOUND: AdminErrors.WORKSPACE_NOT_FOUND,
  })
  .input(AdminResetInviteTokenInputSchema)
  .output(ApiResponseSchema(AdminWorkspaceDetailSchema));

// ============================================
// WORKSPACE RECORDING STATS
// ============================================

/**
 * GET /admin/workspaces/:workspaceId/recording-stats
 * Get recording statistics for a workspace (for charts)
 */
export const getWorkspaceRecordingStats = oc
  .route({
    method: 'GET',
    path: '/admin/workspaces/{workspaceId}/recording-stats',
    inputStructure: 'detailed',
    summary: 'Get workspace recording stats',
    description: 'Get recording statistics for a workspace with weekly breakdown for charts',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
    WORKSPACE_NOT_FOUND: AdminErrors.WORKSPACE_NOT_FOUND,
  })
  .input(AdminGetWorkspaceRecordingStatsInputSchema)
  .output(ApiResponseSchema(AdminWorkspaceRecordingStatsSchema));

/**
 * GET /admin/workspaces/:workspaceId/member-recording-stats
 * Get member recording statistics for a workspace (for pie chart)
 */
export const getWorkspaceMemberRecordingStats = oc
  .route({
    method: 'GET',
    path: '/admin/workspaces/{workspaceId}/member-recording-stats',
    inputStructure: 'detailed',
    summary: 'Get workspace member recording stats',
    description: 'Get recording statistics by member for pie chart visualization',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
    WORKSPACE_NOT_FOUND: AdminErrors.WORKSPACE_NOT_FOUND,
  })
  .input(AdminGetWorkspaceMemberRecordingStatsInputSchema)
  .output(ApiResponseSchema(AdminWorkspaceMemberRecordingStatsSchema));
