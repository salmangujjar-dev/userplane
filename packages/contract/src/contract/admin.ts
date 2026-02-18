import { oc } from '@orpc/contract';

import {
  AdminBanUserInputSchema,
  AdminCreatePlanInputSchema,
  AdminCreateWorkspaceInviteDataSchema,
  AdminCreateWorkspaceInviteInputSchema,
  AdminDeactivateProjectDataSchema,
  AdminDeactivateProjectInputSchema,
  AdminDeactivateWorkspaceInputSchema,
  AdminEntitlementsDataSchema,
  AdminErrors,
  AdminGetEntitlementsInputSchema,
  AdminGetPlanInputSchema,
  AdminGetUserInputSchema,
  AdminGetWorkspaceInputSchema,
  AdminGetWorkspaceMemberRecordingStatsInputSchema,
  AdminGetWorkspaceRecordingStatsInputSchema,
  AdminListUserSessionsInputSchema,
  AdminListUserWorkspacesInputSchema,
  AdminListWorkspaceMembersInputSchema,
  AdminListWorkspaceProjectsInputSchema,
  AdminPlanProductSchema,
  AdminPlansListDataSchema,
  AdminResetInviteTokenInputSchema,
  AdminRestoreProjectDataSchema,
  AdminRestoreProjectInputSchema,
  AdminRestoreWorkspaceDataSchema,
  AdminRestoreWorkspaceInputSchema,
  AdminRevokeAllSessionsInputSchema,
  AdminRevokeSessionInputSchema,
  AdminSearchUsersInputSchema,
  AdminSearchWorkspacesInputSchema,
  AdminUnbanUserInputSchema,
  AdminUpdateEntitlementsInputSchema,
  AdminUpdatePlanInputSchema,
  AdminUserDetailSchema,
  AdminUserSessionsDataSchema,
  AdminUsersListDataSchema,
  AdminUserWorkspacesDataSchema,
  AdminWorkspaceDetailSchema,
  AdminWorkspaceMemberRecordingStatsSchema,
  AdminWorkspaceMembersListDataSchema,
  AdminWorkspaceProjectsListDataSchema,
  AdminWorkspaceRecordingStatsSchema,
  AdminWorkspacesListDataSchema,
  ApiResponseSchema,
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

/**
 * GET /admin/users/:userId/workspaces
 * List user workspaces with pagination
 */
export const listUserWorkspaces = oc
  .route({
    method: 'GET',
    path: '/admin/users/{userId}/workspaces',
    inputStructure: 'detailed',
    summary: 'List user workspaces',
    description: 'Get paginated list of workspaces for a user',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
    USER_NOT_FOUND: AdminErrors.USER_NOT_FOUND,
  })
  .input(AdminListUserWorkspacesInputSchema)
  .output(ApiResponseSchema(AdminUserWorkspacesDataSchema));

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
 * GET /admin/workspaces/:workspaceId/projects
 * List workspace projects with pagination, filtering, and sorting
 */
export const listWorkspaceProjects = oc
  .route({
    method: 'GET',
    path: '/admin/workspaces/{workspaceId}/projects',
    inputStructure: 'detailed',
    summary: 'List workspace projects',
    description: 'Get paginated list of workspace projects with filtering and sorting',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
    WORKSPACE_NOT_FOUND: AdminErrors.WORKSPACE_NOT_FOUND,
  })
  .input(AdminListWorkspaceProjectsInputSchema)
  .output(ApiResponseSchema(AdminWorkspaceProjectsListDataSchema));

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
 * POST /admin/workspaces/:workspaceId/restore
 * Restore a soft-deleted workspace
 */
export const restoreWorkspace = oc
  .route({
    method: 'POST',
    path: '/admin/workspaces/{workspaceId}/restore',
    inputStructure: 'detailed',
    summary: 'Restore workspace',
    description:
      'Restore a soft-deleted workspace and its associated projects and links within the grace period',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
    WORKSPACE_NOT_FOUND: AdminErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_RESTORE_TIME_EXPIRED: AdminErrors.WORKSPACE_RESTORE_TIME_EXPIRED,
    WORKSPACE_RESTORE_FAILED: AdminErrors.WORKSPACE_RESTORE_FAILED,
  })
  .input(AdminRestoreWorkspaceInputSchema)
  .output(ApiResponseSchema(AdminRestoreWorkspaceDataSchema));

/**
 * POST /admin/workspaces/:workspaceId/projects/:projectId/deactivate
 * Deactivate (soft delete) a project
 */
export const deactivateProject = oc
  .route({
    method: 'POST',
    path: '/admin/workspaces/{workspaceId}/projects/{projectId}/deactivate',
    inputStructure: 'detailed',
    summary: 'Deactivate project',
    description: 'Soft delete a project',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
    PROJECT_NOT_FOUND: AdminErrors.PROJECT_NOT_FOUND,
  })
  .input(AdminDeactivateProjectInputSchema)
  .output(ApiResponseSchema(AdminDeactivateProjectDataSchema));

/**
 * POST /admin/workspaces/:workspaceId/projects/:projectId/restore
 * Restore a soft-deleted project
 */
export const restoreProject = oc
  .route({
    method: 'POST',
    path: '/admin/workspaces/{workspaceId}/projects/{projectId}/restore',
    inputStructure: 'detailed',
    summary: 'Restore project',
    description: 'Restore a soft-deleted project within the grace period',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
    PROJECT_NOT_FOUND: AdminErrors.PROJECT_NOT_FOUND,
    PROJECT_RESTORE_TIME_EXPIRED: AdminErrors.PROJECT_RESTORE_TIME_EXPIRED,
    PROJECT_RESTORE_FAILED: AdminErrors.PROJECT_RESTORE_FAILED,
  })
  .input(AdminRestoreProjectInputSchema)
  .output(ApiResponseSchema(AdminRestoreProjectDataSchema));

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

// ============================================
// WORKSPACE ENTITLEMENTS
// ============================================

/**
 * GET /admin/workspaces/:workspaceId/entitlements
 * Get all entitlements for a workspace
 */
export const getWorkspaceEntitlements = oc
  .route({
    method: 'GET',
    path: '/admin/workspaces/{workspaceId}/entitlements',
    inputStructure: 'detailed',
    summary: 'Get workspace entitlements',
    description: 'Get all resource entitlements for a workspace',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
    WORKSPACE_NOT_FOUND: AdminErrors.WORKSPACE_NOT_FOUND,
  })
  .input(AdminGetEntitlementsInputSchema)
  .output(ApiResponseSchema(AdminEntitlementsDataSchema));

/**
 * PATCH /admin/workspaces/:workspaceId/entitlements
 * Update entitlement limits for a workspace
 */
export const updateWorkspaceEntitlements = oc
  .route({
    method: 'PATCH',
    path: '/admin/workspaces/{workspaceId}/entitlements',
    inputStructure: 'detailed',
    summary: 'Update workspace entitlements',
    description: 'Update resource entitlement limits for a workspace',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
    WORKSPACE_NOT_FOUND: AdminErrors.WORKSPACE_NOT_FOUND,
  })
  .input(AdminUpdateEntitlementsInputSchema)
  .output(ApiResponseSchema(AdminEntitlementsDataSchema));

/**
 * POST /admin/workspace/create/invite
 * Generate workspace create invite URL for admin provisioning
 */
export const createWorkspaceInvite = oc
  .route({
    method: 'POST',
    path: '/admin/workspace/create/invite',
    inputStructure: 'detailed',
    summary: 'Create workspace invite',
    description: 'Generate a workspace creation invite URL with predetermined workspace details',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
  })
  .input(AdminCreateWorkspaceInviteInputSchema)
  .output(ApiResponseSchema(AdminCreateWorkspaceInviteDataSchema));

// ============================================
// PLAN MANAGEMENT
// ============================================

/**
 * GET /admin/plans
 * List all DodoPayments products
 */
export const listPlans = oc
  .route({
    method: 'GET',
    path: '/admin/plans',
    inputStructure: 'detailed',
    summary: 'List plan products',
    description: 'List all DodoPayments products with decoded metadata',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
  })
  .output(ApiResponseSchema(AdminPlansListDataSchema));

/**
 * GET /admin/plans/{productId}
 * Get a single DodoPayments product
 */
export const getPlan = oc
  .route({
    method: 'GET',
    path: '/admin/plans/{productId}',
    inputStructure: 'detailed',
    summary: 'Get plan product',
    description: 'Get a single DodoPayments product with decoded metadata',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
    PLAN_NOT_FOUND: AdminErrors.PLAN_NOT_FOUND,
  })
  .input(AdminGetPlanInputSchema)
  .output(ApiResponseSchema(AdminPlanProductSchema));

/**
 * POST /admin/plans
 * Create a new DodoPayments product
 */
export const createPlan = oc
  .route({
    method: 'POST',
    path: '/admin/plans',
    inputStructure: 'detailed',
    summary: 'Create plan product',
    description: 'Create a new DodoPayments product with feature metadata',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
    PLAN_CREATE_FAILED: AdminErrors.PLAN_CREATE_FAILED,
  })
  .input(AdminCreatePlanInputSchema)
  .output(ApiResponseSchema(AdminPlanProductSchema));

/**
 * PATCH /admin/plans/{productId}
 * Update a DodoPayments product
 */
export const updatePlan = oc
  .route({
    method: 'PATCH',
    path: '/admin/plans/{productId}',
    inputStructure: 'detailed',
    summary: 'Update plan product',
    description: 'Update a DodoPayments product and its feature metadata',
    tags: ['Admin'],
  })
  .errors({
    UNAUTHORIZED: AdminErrors.UNAUTHORIZED,
    NOT_ADMIN: AdminErrors.NOT_ADMIN,
    PLAN_NOT_FOUND: AdminErrors.PLAN_NOT_FOUND,
    PLAN_UPDATE_FAILED: AdminErrors.PLAN_UPDATE_FAILED,
  })
  .input(AdminUpdatePlanInputSchema)
  .output(ApiResponseSchema(AdminPlanProductSchema));
