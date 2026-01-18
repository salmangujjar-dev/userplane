import { PLAN_IDS } from '@workspace/pricing';
import { z } from 'zod';

import {
  ADMIN_USER_SESSIONS_PAGINATION,
  ADMIN_USER_WORKSPACES_PAGINATION,
  ADMIN_USERS_PAGINATION,
  ADMIN_WORKSPACE_MEMBERS_PAGINATION,
  ADMIN_WORKSPACE_PROJECTS_PAGINATION,
  ADMIN_WORKSPACES_PAGINATION,
} from '../constants';
import {
  ADMIN_FILTER_STATUS_VALUES,
  ADMIN_NOTIFY_DURATION_VALUES,
  ADMIN_PROJECT_SORT_FIELDS,
  ADMIN_PROVISION_ROLE_VALUES,
  ADMIN_RECORDING_WEEKS_VALUES,
  ADMIN_USER_FILTER_STATUS_VALUES,
  ADMIN_USER_SORT_FIELDS,
  ADMIN_WORKSPACE_FILTER_STATUS_VALUES,
  ADMIN_WORKSPACE_SORT_FIELDS,
  EmailSchema,
  NameSchema,
  ProjectIdSchema,
  ReasonTextSchema,
  SessionIdSchema,
  SortDirectionSchema,
  STREAMING_STATUS_VALUES,
  UPLOAD_STATUS_VALUES,
  UserIdSchema,
  WORKSPACE_ROLE_VALUES,
  WorkspaceIdSchema,
} from './common';

/**
 * Admin schemas for user management
 */

/**
 * Admin user workspace info
 */
export const AdminUserWorkspaceSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  workspaceName: z.string(),
  workspaceRole: z.enum(WORKSPACE_ROLE_VALUES),
  joinedAt: z.string(),
});

/**
 * Admin user session info
 */
export const AdminUserSessionSchema = z.object({
  id: SessionIdSchema,
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.string(),
  expiresAt: z.string(),
  impersonatedBy: UserIdSchema.nullable(),
  isCurrent: z.boolean().optional(),
});

/**
 * Admin user in list view
 */
export const AdminUserListItemSchema = z.object({
  id: UserIdSchema,
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
  id: UserIdSchema,
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
      limit: z.coerce
        .number()
        .int()
        .min(ADMIN_USERS_PAGINATION.MIN_PER_PAGE)
        .max(ADMIN_USERS_PAGINATION.MAX_PER_PAGE)
        .optional()
        .default(ADMIN_USERS_PAGINATION.DEFAULT_PER_PAGE),
      offset: z.coerce.number().int().min(0).optional().default(0),
      sortBy: z.enum(ADMIN_USER_SORT_FIELDS).optional().default('createdAt'),
      sortDirection: SortDirectionSchema.optional().default('desc'),
      filterStatus: z.enum(ADMIN_USER_FILTER_STATUS_VALUES).optional(),
    })
    .optional()
    .default({}),
});

/**
 * Get user detail input
 */
export const AdminGetUserInputSchema = z.object({
  params: z.object({
    userId: UserIdSchema,
  }),
});

/**
 * Ban user input
 */
export const AdminBanUserInputSchema = z.object({
  params: z.object({
    userId: UserIdSchema,
  }),
  body: z.object({
    reason: ReasonTextSchema,
    expiresInSeconds: z.number().int().positive().optional(),
  }),
});

/**
 * Unban user input
 */
export const AdminUnbanUserInputSchema = z.object({
  params: z.object({
    userId: UserIdSchema,
  }),
});

/**
 * List user sessions input
 */
export const AdminListUserSessionsInputSchema = z.object({
  params: z.object({
    userId: UserIdSchema,
  }),
  query: z
    .object({
      limit: z.coerce
        .number()
        .int()
        .min(ADMIN_USER_SESSIONS_PAGINATION.MIN_PER_PAGE)
        .max(ADMIN_USER_SESSIONS_PAGINATION.MAX_PER_PAGE)
        .optional()
        .default(ADMIN_USER_SESSIONS_PAGINATION.DEFAULT_PER_PAGE),
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
    sessionId: SessionIdSchema,
  }),
});

/**
 * Revoke all user sessions input
 */
export const AdminRevokeAllSessionsInputSchema = z.object({
  params: z.object({
    userId: UserIdSchema,
  }),
});

/**
 * User sessions list response
 */
export const AdminUserSessionsDataSchema = z.object({
  sessions: z.array(AdminUserSessionSchema),
  userId: UserIdSchema,
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

/**
 * List user workspaces input
 */
export const AdminListUserWorkspacesInputSchema = z.object({
  params: z.object({
    userId: UserIdSchema,
  }),
  query: z
    .object({
      limit: z.coerce
        .number()
        .int()
        .min(ADMIN_USER_WORKSPACES_PAGINATION.MIN_PER_PAGE)
        .max(ADMIN_USER_WORKSPACES_PAGINATION.MAX_PER_PAGE)
        .optional()
        .default(ADMIN_USER_WORKSPACES_PAGINATION.DEFAULT_PER_PAGE),
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
  userId: UserIdSchema,
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
  userId: UserIdSchema,
  userName: z.string(),
  userEmail: z.string(),
  workspaceRole: z.enum(WORKSPACE_ROLE_VALUES),
  joinedAt: z.string(),
});

/**
 * Admin workspace in list view
 */
export const AdminWorkspaceListItemSchema = z.object({
  workspaceId: WorkspaceIdSchema,
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
  workspaceId: WorkspaceIdSchema,
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
    workspaceId: WorkspaceIdSchema,
  }),
  query: z
    .object({
      limit: z.coerce
        .number()
        .int()
        .min(ADMIN_WORKSPACE_MEMBERS_PAGINATION.MIN_PER_PAGE)
        .max(ADMIN_WORKSPACE_MEMBERS_PAGINATION.MAX_PER_PAGE)
        .optional()
        .default(ADMIN_WORKSPACE_MEMBERS_PAGINATION.DEFAULT_PER_PAGE),
      offset: z.coerce.number().int().min(0).optional().default(0),
    })
    .optional()
    .default({}),
});

/**
 * Admin workspace project item
 */
export const AdminWorkspaceProjectSchema = z.object({
  projectId: ProjectIdSchema,
  projectTitle: z.string(),
  isDefault: z.boolean(),
  isDeleted: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  recordingCount: z.number().int().nonnegative(),
});

/**
 * Admin workspace projects list response
 */
export const AdminWorkspaceProjectsListDataSchema = z.object({
  projects: z.array(AdminWorkspaceProjectSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

/**
 * List workspace projects input
 */
export const AdminListWorkspaceProjectsInputSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  query: z
    .object({
      search: z.string().optional(),
      limit: z.coerce
        .number()
        .int()
        .min(ADMIN_WORKSPACE_PROJECTS_PAGINATION.MIN_PER_PAGE)
        .max(ADMIN_WORKSPACE_PROJECTS_PAGINATION.MAX_PER_PAGE)
        .optional()
        .default(ADMIN_WORKSPACE_PROJECTS_PAGINATION.DEFAULT_PER_PAGE),
      offset: z.coerce.number().int().min(0).optional().default(0),
      sortBy: z.enum(ADMIN_PROJECT_SORT_FIELDS).optional().default('created_at'),
      sortDirection: SortDirectionSchema.optional().default('desc'),
      filterStatus: z.enum(ADMIN_FILTER_STATUS_VALUES).optional().default('active'),
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
      limit: z.coerce
        .number()
        .int()
        .min(ADMIN_WORKSPACES_PAGINATION.MIN_PER_PAGE)
        .max(ADMIN_WORKSPACES_PAGINATION.MAX_PER_PAGE)
        .optional()
        .default(ADMIN_WORKSPACES_PAGINATION.DEFAULT_PER_PAGE),
      offset: z.coerce.number().int().min(0).optional().default(0),
      sortBy: z.enum(ADMIN_WORKSPACE_SORT_FIELDS).optional().default('createdAt'),
      sortDirection: SortDirectionSchema.optional().default('desc'),
      filterStatus: z.enum(ADMIN_WORKSPACE_FILTER_STATUS_VALUES).optional(),
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
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * Deactivate workspace input
 */
export const AdminDeactivateWorkspaceInputSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * Restore workspace input
 */
export const AdminRestoreWorkspaceInputSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * Restore workspace response data
 */
export const AdminRestoreWorkspaceDataSchema = z.object({
  workspace: z.object({
    workspaceId: WorkspaceIdSchema,
    workspaceName: z.string(),
    isDeleted: z.boolean(),
    deletedAt: z.string().nullable(),
  }),
  restoredProjects: z.number().int().nonnegative(),
  restoredLinks: z.number().int().nonnegative(),
});

/**
 * Deactivate project input
 */
export const AdminDeactivateProjectInputSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    projectId: ProjectIdSchema,
  }),
});

/**
 * Deactivate project response data
 */
export const AdminDeactivateProjectDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  projectId: ProjectIdSchema,
});

/**
 * Restore project input
 */
export const AdminRestoreProjectInputSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    projectId: ProjectIdSchema,
  }),
});

/**
 * Restore project response data
 */
export const AdminRestoreProjectDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  project: z.object({
    projectId: ProjectIdSchema,
    projectTitle: z.string(),
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
    workspaceId: WorkspaceIdSchema,
  }),
});

// ============================================
// ADMIN RECORDING SCHEMAS
// ============================================

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
  workspaceId: WorkspaceIdSchema,
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
  memberId: UserIdSchema,
  memberName: z.string(),
  recordingCount: z.number(),
  totalDuration: z.number(),
});

/**
 * Workspace member recording stats response (for pie chart)
 */
export const AdminWorkspaceMemberRecordingStatsSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  workspaceName: z.string(),
  memberStats: z.array(AdminMemberRecordingStatSchema),
});

/**
 * Get workspace recording stats input
 */
export const AdminGetWorkspaceRecordingStatsInputSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  query: z
    .object({
      filterUploadStatus: z.enum(UPLOAD_STATUS_VALUES).optional(),
      filterStreamingStatus: z.enum(STREAMING_STATUS_VALUES).optional(),
      filterDeleted: z.enum(ADMIN_FILTER_STATUS_VALUES).optional().default('all'),
      weeksToShow: z.enum(ADMIN_RECORDING_WEEKS_VALUES).optional().default('12'),
    })
    .optional()
    .default({}),
});

/**
 * Get workspace member recording stats input
 */
export const AdminGetWorkspaceMemberRecordingStatsInputSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  query: z
    .object({
      filterUploadStatus: z.enum(UPLOAD_STATUS_VALUES).optional(),
      filterStreamingStatus: z.enum(STREAMING_STATUS_VALUES).optional(),
      filterDeleted: z.enum(ADMIN_FILTER_STATUS_VALUES).optional().default('all'),
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
export type AdminWorkspaceProject = z.infer<typeof AdminWorkspaceProjectSchema>;
export type AdminWorkspaceProjectsListData = z.infer<typeof AdminWorkspaceProjectsListDataSchema>;
export type AdminSearchWorkspacesInput = z.infer<typeof AdminSearchWorkspacesInputSchema>;
export type AdminGetWorkspaceInput = z.infer<typeof AdminGetWorkspaceInputSchema>;
export type AdminListWorkspaceMembersInput = z.infer<typeof AdminListWorkspaceMembersInputSchema>;
export type AdminListWorkspaceProjectsInput = z.infer<typeof AdminListWorkspaceProjectsInputSchema>;
export type AdminDeactivateWorkspaceInput = z.infer<typeof AdminDeactivateWorkspaceInputSchema>;
export type AdminRestoreWorkspaceInput = z.infer<typeof AdminRestoreWorkspaceInputSchema>;
export type AdminRestoreWorkspaceData = z.infer<typeof AdminRestoreWorkspaceDataSchema>;
export type AdminDeactivateProjectInput = z.infer<typeof AdminDeactivateProjectInputSchema>;
export type AdminDeactivateProjectData = z.infer<typeof AdminDeactivateProjectDataSchema>;
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
  name: NameSchema,
  role: z.enum(ADMIN_PROVISION_ROLE_VALUES).default('member'),
});

/**
 * Admin provision workspace input
 */
export const AdminProvisionWorkspaceInputSchema = z.object({
  body: z.object({
    owner: z.object({
      email: EmailSchema,
      name: NameSchema,
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
  userId: UserIdSchema,
  email: z.string(),
  name: z.string(),
  isNew: z.boolean(),
});

/**
 * Admin provision workspace member response
 */
export const AdminProvisionMemberResponseSchema = z.object({
  userId: UserIdSchema,
  email: z.string(),
  name: z.string(),
  role: z.enum(ADMIN_PROVISION_ROLE_VALUES),
  isNew: z.boolean(),
});

/**
 * Admin provision workspace response data
 */
export const AdminProvisionWorkspaceDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
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

// ============================================
// WORKSPACE INVITE SCHEMAS
// ============================================

/**
 * Admin create workspace invite input
 */
export const AdminCreateWorkspaceInviteInputSchema = z.object({
  body: z.object({
    workspaceUrl: z.string().url('Invalid URL'),
    plan: z.enum(PLAN_IDS).optional().default('sandbox'),
    notify: z.enum(ADMIN_NOTIFY_DURATION_VALUES).optional().default('never'),
    email: EmailSchema.optional(),
  }),
});

/**
 * Admin create workspace invite response data
 */
export const AdminCreateWorkspaceInviteDataSchema = z.object({
  inviteUrl: z.string(),
  workspaceId: WorkspaceIdSchema,
  workspaceUrl: z.string(),
  workspacePlan: z.enum(PLAN_IDS),
});

/**
 * Types - Workspace Invite
 */
export type AdminCreateWorkspaceInviteInput = z.infer<typeof AdminCreateWorkspaceInviteInputSchema>;
export type AdminCreateWorkspaceInviteData = z.infer<typeof AdminCreateWorkspaceInviteDataSchema>;
