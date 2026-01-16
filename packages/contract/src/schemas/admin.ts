import { z } from 'zod';
import { PLAN_IDS } from '@workspace/pricing';
import { EmailSchema } from './common';

/**
 * Admin schemas for user management
 */

/**
 * Admin user workspace info
 */
export const AdminUserWorkspaceSchema = z.object({
  workspaceId: z.string(),
  workspaceName: z.string(),
  workspaceRole: z.enum(['owner', 'admin', 'member']),
  joinedAt: z.string(),
});

/**
 * Admin user session info
 */
export const AdminUserSessionSchema = z.object({
  id: z.string(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.string(),
  expiresAt: z.string(),
  impersonatedBy: z.string().nullable(),
  isCurrent: z.boolean().optional(),
});

/**
 * Admin user in list view
 */
export const AdminUserListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  role: z.string().nullable(),
  banned: z.boolean().nullable(),
  banReason: z.string().nullable(),
  banExpires: z.string().nullable(),
  emailVerified: z.boolean(),
  createdAt: z.string(),
  workspaceCount: z.number(),
});

/**
 * Admin user detail view
 * Note: Sessions and workspaces are fetched separately via dedicated endpoints
 */
export const AdminUserDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  role: z.string().nullable(),
  banned: z.boolean().nullable(),
  banReason: z.string().nullable(),
  banExpires: z.string().nullable(),
  emailVerified: z.boolean(),
  createdAt: z.string(),
  workspaceCount: z.number(),
});

/**
 * Admin users list response
 */
export const AdminUsersListDataSchema = z.object({
  users: z.array(AdminUserListItemSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

/**
 * Search users input
 * Note: Only non-admin users are returned (admins are always filtered out)
 */
export const AdminSearchUsersInputSchema = z.object({
  query: z
    .object({
      search: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(100).optional().default(5),
      offset: z.coerce.number().int().min(0).optional().default(0),
      sortBy: z.enum(['createdAt', 'name', 'email']).optional().default('createdAt'),
      sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
      filterStatus: z.enum(['active', 'banned']).optional(),
    })
    .optional()
    .default({}),
});

/**
 * Get user detail input
 */
export const AdminGetUserInputSchema = z.object({
  params: z.object({
    userId: z.string().min(1),
  }),
});

/**
 * Ban user input
 */
export const AdminBanUserInputSchema = z.object({
  params: z.object({
    userId: z.string().min(1),
  }),
  body: z.object({
    reason: z.string().min(1, 'Ban reason is required'),
    expiresInSeconds: z.number().int().positive().optional(),
  }),
});

/**
 * Unban user input
 */
export const AdminUnbanUserInputSchema = z.object({
  params: z.object({
    userId: z.string().min(1),
  }),
});

/**
 * List user sessions input
 */
export const AdminListUserSessionsInputSchema = z.object({
  params: z.object({
    userId: z.string().min(1),
  }),
  query: z
    .object({
      limit: z.coerce.number().int().min(1).max(5).optional().default(5),
      offset: z.coerce.number().int().min(0).optional().default(0),
    })
    .optional()
    .default({}),
});

/**
 * Revoke session input
 */
export const AdminRevokeSessionInputSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1),
  }),
});

/**
 * Revoke all user sessions input
 */
export const AdminRevokeAllSessionsInputSchema = z.object({
  params: z.object({
    userId: z.string().min(1),
  }),
});

/**
 * User sessions list response
 */
export const AdminUserSessionsDataSchema = z.object({
  sessions: z.array(AdminUserSessionSchema),
  userId: z.string(),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

/**
 * List user workspaces input
 */
export const AdminListUserWorkspacesInputSchema = z.object({
  params: z.object({
    userId: z.string().min(1),
  }),
  query: z
    .object({
      limit: z.coerce.number().int().min(1).max(10).optional().default(10),
      offset: z.coerce.number().int().min(0).optional().default(0),
    })
    .optional()
    .default({}),
});

/**
 * User workspaces list response
 */
export const AdminUserWorkspacesDataSchema = z.object({
  workspaces: z.array(AdminUserWorkspaceSchema),
  userId: z.string(),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

// ============================================
// ADMIN WORKSPACE SCHEMAS
// ============================================

/**
 * Admin workspace member info (for detail view)
 */
export const AdminWorkspaceMemberSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  userEmail: z.string(),
  workspaceRole: z.enum(['owner', 'admin', 'member']),
  joinedAt: z.string(),
});

/**
 * Admin workspace in list view
 */
export const AdminWorkspaceListItemSchema = z.object({
  workspaceId: z.string(),
  workspaceName: z.string(),
  workspacePlan: z.enum(PLAN_IDS),
  workspacePlanName: z.string(),
  createdAt: z.string(),
  memberCount: z.number(),
  projectCount: z.number(),
  domainCount: z.number(),
  linkCount: z.number(),
  recordingCount: z.number(),
  isDeleted: z.boolean(),
});

/**
 * Admin workspace detail view
 * Note: Members are fetched separately via listWorkspaceMembers endpoint
 * Recording customization fields are intentionally excluded (not displayed in admin UI)
 */
export const AdminWorkspaceDetailSchema = z.object({
  workspaceId: z.string(),
  workspaceName: z.string(),
  workspacePlan: z.enum(PLAN_IDS),
  workspacePlanName: z.string(),
  createdAt: z.string(),
  isDeleted: z.boolean(),
  deletedAt: z.string().nullable(),
  memberCount: z.number(),
  projectCount: z.number(),
  domainCount: z.number(),
  linkCount: z.number(),
  recordingCount: z.number(),
});

/**
 * Admin workspaces list response
 */
export const AdminWorkspacesListDataSchema = z.object({
  workspaces: z.array(AdminWorkspaceListItemSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

/**
 * Admin workspace members list response
 */
export const AdminWorkspaceMembersListDataSchema = z.object({
  members: z.array(AdminWorkspaceMemberSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

/**
 * List workspace members input
 */
export const AdminListWorkspaceMembersInputSchema = z.object({
  params: z.object({
    workspaceId: z.string().min(1),
  }),
  query: z
    .object({
      limit: z.coerce.number().int().min(1).max(10).optional().default(10),
      offset: z.coerce.number().int().min(0).optional().default(0),
    })
    .optional()
    .default({}),
});

/**
 * Search workspaces input
 */
export const AdminSearchWorkspacesInputSchema = z.object({
  query: z
    .object({
      search: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(100).optional().default(5),
      offset: z.coerce.number().int().min(0).optional().default(0),
      sortBy: z.enum(['createdAt', 'name', 'memberCount']).optional().default('createdAt'),
      sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
      filterStatus: z.enum(['active', 'deleted']).optional(),
      filterPlan: z.enum(PLAN_IDS).optional(),
    })
    .optional()
    .default({}),
});

/**
 * Get workspace detail input
 */
export const AdminGetWorkspaceInputSchema = z.object({
  params: z.object({
    workspaceId: z.string().min(1),
  }),
});

/**
 * Deactivate workspace input
 */
export const AdminDeactivateWorkspaceInputSchema = z.object({
  params: z.object({
    workspaceId: z.string().min(1),
  }),
});

/**
 * Restore workspace input
 */
export const AdminRestoreWorkspaceInputSchema = z.object({
  params: z.object({
    workspaceId: z.string().min(1),
  }),
});

/**
 * Restore workspace response data
 */
export const AdminRestoreWorkspaceDataSchema = z.object({
  workspace: z.object({
    workspaceId: z.string(),
    workspaceName: z.string(),
    isDeleted: z.boolean(),
    deletedAt: z.string().nullable(),
  }),
  restoredProjects: z.number().int().nonnegative(),
  restoredLinks: z.number().int().nonnegative(),
});

/**
 * Restore project input
 */
export const AdminRestoreProjectInputSchema = z.object({
  params: z.object({
    workspaceId: z.string().min(1),
    projectId: z.string().min(1),
  }),
});

/**
 * Restore project response data
 */
export const AdminRestoreProjectDataSchema = z.object({
  workspaceId: z.string(),
  project: z.object({
    projectId: z.string(),
    projectTitle: z.string().nullable(),
    isDefault: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

/**
 * Reset invite token input
 */
export const AdminResetInviteTokenInputSchema = z.object({
  params: z.object({
    workspaceId: z.string().min(1),
  }),
});

// ============================================
// ADMIN RECORDING SCHEMAS
// ============================================

/**
 * Streaming status enum matching database values
 */
const streamingStatusEnum = z.enum(['pending', 'available', 'failed', 'expired', 'purged']);

/**
 * Weekly stats for chart
 */
export const AdminRecordingWeeklyStatSchema = z.object({
  week: z.string(),
  recordingCount: z.number(),
  totalDuration: z.number(),
});

/**
 * Workspace recording stats response (for detail view charts)
 */
export const AdminWorkspaceRecordingStatsSchema = z.object({
  workspaceId: z.string(),
  workspaceName: z.string(),
  totalRecordings: z.number(),
  totalDuration: z.number(),
  activeRecordings: z.number(),
  deletedRecordings: z.number(),
  weeklyStats: z.array(AdminRecordingWeeklyStatSchema),
});

/**
 * Member recording stat (for pie chart)
 */
export const AdminMemberRecordingStatSchema = z.object({
  memberId: z.string(),
  memberName: z.string(),
  recordingCount: z.number(),
  totalDuration: z.number(),
});

/**
 * Workspace member recording stats response (for pie chart)
 */
export const AdminWorkspaceMemberRecordingStatsSchema = z.object({
  workspaceId: z.string(),
  workspaceName: z.string(),
  memberStats: z.array(AdminMemberRecordingStatSchema),
});

/**
 * Upload status enum matching database values
 */
const uploadStatusEnum = z.enum(['pending', 'available', 'expired', 'purged']);

/**
 * Weeks to show enum for recording stats
 */
const weeksToShowEnum = z.enum(['12', '24', '36', '48']);

/**
 * Get workspace recording stats input
 */
export const AdminGetWorkspaceRecordingStatsInputSchema = z.object({
  params: z.object({
    workspaceId: z.string().min(1),
  }),
  query: z
    .object({
      filterUploadStatus: uploadStatusEnum.optional(),
      filterStreamingStatus: streamingStatusEnum.optional(),
      filterDeleted: z.enum(['all', 'active', 'deleted']).optional().default('all'),
      weeksToShow: weeksToShowEnum.optional().default('12'),
    })
    .optional()
    .default({}),
});

/**
 * Get workspace member recording stats input
 */
export const AdminGetWorkspaceMemberRecordingStatsInputSchema = z.object({
  params: z.object({
    workspaceId: z.string().min(1),
  }),
  query: z
    .object({
      filterUploadStatus: uploadStatusEnum.optional(),
      filterStreamingStatus: streamingStatusEnum.optional(),
      filterDeleted: z.enum(['all', 'active', 'deleted']).optional().default('all'),
    })
    .optional()
    .default({}),
});

/**
 * Types - Users
 */
export type AdminUserWorkspace = z.infer<typeof AdminUserWorkspaceSchema>;
export type AdminUserSession = z.infer<typeof AdminUserSessionSchema>;
export type AdminUserListItem = z.infer<typeof AdminUserListItemSchema>;
export type AdminUserDetail = z.infer<typeof AdminUserDetailSchema>;
export type AdminUsersListData = z.infer<typeof AdminUsersListDataSchema>;
export type AdminSearchUsersInput = z.infer<typeof AdminSearchUsersInputSchema>;
export type AdminGetUserInput = z.infer<typeof AdminGetUserInputSchema>;
export type AdminBanUserInput = z.infer<typeof AdminBanUserInputSchema>;
export type AdminUnbanUserInput = z.infer<typeof AdminUnbanUserInputSchema>;
export type AdminListUserSessionsInput = z.infer<typeof AdminListUserSessionsInputSchema>;
export type AdminRevokeSessionInput = z.infer<typeof AdminRevokeSessionInputSchema>;
export type AdminRevokeAllSessionsInput = z.infer<typeof AdminRevokeAllSessionsInputSchema>;
export type AdminUserSessionsData = z.infer<typeof AdminUserSessionsDataSchema>;
export type AdminListUserWorkspacesInput = z.infer<typeof AdminListUserWorkspacesInputSchema>;
export type AdminUserWorkspacesData = z.infer<typeof AdminUserWorkspacesDataSchema>;

/**
 * Types - Workspaces
 */
export type AdminWorkspaceMember = z.infer<typeof AdminWorkspaceMemberSchema>;
export type AdminWorkspaceListItem = z.infer<typeof AdminWorkspaceListItemSchema>;
export type AdminWorkspaceDetail = z.infer<typeof AdminWorkspaceDetailSchema>;
export type AdminWorkspacesListData = z.infer<typeof AdminWorkspacesListDataSchema>;
export type AdminWorkspaceMembersListData = z.infer<typeof AdminWorkspaceMembersListDataSchema>;
export type AdminSearchWorkspacesInput = z.infer<typeof AdminSearchWorkspacesInputSchema>;
export type AdminGetWorkspaceInput = z.infer<typeof AdminGetWorkspaceInputSchema>;
export type AdminListWorkspaceMembersInput = z.infer<typeof AdminListWorkspaceMembersInputSchema>;
export type AdminDeactivateWorkspaceInput = z.infer<typeof AdminDeactivateWorkspaceInputSchema>;
export type AdminRestoreWorkspaceInput = z.infer<typeof AdminRestoreWorkspaceInputSchema>;
export type AdminRestoreWorkspaceData = z.infer<typeof AdminRestoreWorkspaceDataSchema>;
export type AdminRestoreProjectInput = z.infer<typeof AdminRestoreProjectInputSchema>;
export type AdminRestoreProjectData = z.infer<typeof AdminRestoreProjectDataSchema>;
export type AdminResetInviteTokenInput = z.infer<typeof AdminResetInviteTokenInputSchema>;

/**
 * Types - Recordings
 */
export type AdminRecordingWeeklyStat = z.infer<typeof AdminRecordingWeeklyStatSchema>;
export type AdminWorkspaceRecordingStats = z.infer<typeof AdminWorkspaceRecordingStatsSchema>;
export type AdminGetWorkspaceRecordingStatsInput = z.infer<
  typeof AdminGetWorkspaceRecordingStatsInputSchema
>;

// ============================================
// ADMIN PROVISIONING SCHEMAS
// ============================================

/**
 * Admin provision workspace member input
 */
export const AdminProvisionMemberSchema = z.object({
  email: EmailSchema,
  name: z.string().min(1, 'Name is required').max(255),
  role: z.enum(['admin', 'member']).default('member'),
});

/**
 * Admin provision workspace input
 */
export const AdminProvisionWorkspaceInputSchema = z.object({
  body: z.object({
    owner: z.object({
      email: EmailSchema,
      name: z.string().min(1, 'Name is required').max(255),
    }),
    workspace: z.object({
      name: z.string().min(1, 'Workspace name is required').max(255),
      url: z.string().url('Invalid URL'),
      plan: z.enum(PLAN_IDS).optional().default('early_bird_monthly'),
    }),
    members: z.array(AdminProvisionMemberSchema).optional().default([]),
  }),
});

/**
 * Admin provision workspace owner response
 */
export const AdminProvisionOwnerSchema = z.object({
  userId: z.string(),
  email: z.string(),
  name: z.string(),
  isNew: z.boolean(),
});

/**
 * Admin provision workspace member response
 */
export const AdminProvisionMemberResponseSchema = z.object({
  userId: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.enum(['admin', 'member']),
  isNew: z.boolean(),
});

/**
 * Admin provision workspace response data
 */
export const AdminProvisionWorkspaceDataSchema = z.object({
  workspaceId: z.string(),
  workspaceName: z.string(),
  owner: AdminProvisionOwnerSchema,
  members: z.array(AdminProvisionMemberResponseSchema),
});

/**
 * Types - Provisioning
 */
export type AdminProvisionMember = z.infer<typeof AdminProvisionMemberSchema>;
export type AdminProvisionWorkspaceInput = z.infer<typeof AdminProvisionWorkspaceInputSchema>;
export type AdminProvisionOwner = z.infer<typeof AdminProvisionOwnerSchema>;
export type AdminProvisionMemberResponse = z.infer<typeof AdminProvisionMemberResponseSchema>;
export type AdminProvisionWorkspaceData = z.infer<typeof AdminProvisionWorkspaceDataSchema>;
