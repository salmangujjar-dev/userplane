import { FEATURE_GATE_KEYS, RESOURCE_TYPE_VALUES } from '@workspace/pricing';
import { z } from 'zod';

import {
  ADMIN_TRIAL_PERIOD_VALUES,
  ADMIN_USER_SESSIONS_PAGINATION,
  ADMIN_USER_WORKSPACES_PAGINATION,
  ADMIN_USERS_PAGINATION,
  ADMIN_WORKSPACE_MEMBERS_PAGINATION,
  ADMIN_WORKSPACE_PROJECTS_PAGINATION,
  ADMIN_WORKSPACES_PAGINATION,
  DEFAULT_TRIAL_PERIOD_DAYS,
} from '../constants';
import {
  AccessDetailSchema,
  AddonsStatusDataSchema,
  ContractDetailSchema,
  FeatureGatesSchema,
} from './billing';
import {
  ADMIN_FILTER_STATUS_VALUES,
  ADMIN_NOTIFY_DURATION_VALUES,
  ADMIN_PROJECT_SORT_FIELDS,
  ADMIN_RECORDING_WEEKS_VALUES,
  ADMIN_USER_FILTER_STATUS_VALUES,
  ADMIN_USER_SORT_FIELDS,
  ADMIN_WORKSPACE_FILTER_STATUS_VALUES,
  ADMIN_WORKSPACE_SORT_FIELDS,
  DomainUrlSchema,
  EmailSchema,
  NameSchema,
  ProjectIdSchema,
  ReasonTextSchema,
  SessionIdSchema,
  SortDirectionSchema,
  STREAMING_STATUS_VALUES,
  UPLOAD_STATUS_VALUES,
  URLSchema,
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
  joinedAt: z.coerce.date(),
});

/**
 * Admin user session info
 */
export const AdminUserSessionSchema = z.object({
  id: SessionIdSchema,
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
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
  banExpires: z.coerce.date().nullable(),
  emailVerified: z.boolean(),
  createdAt: z.coerce.date(),
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
  banExpires: z.coerce.date().nullable(),
  emailVerified: z.boolean(),
  createdAt: z.coerce.date(),
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
 * deleteWorkspacesForRoles: array of workspace roles that trigger workspace deletion
 * - If user has any of these roles in a workspace, that workspace will be deleted
 * - Default: ['owner'] (only delete workspaces where user is owner)
 * - Options: 'owner', 'admin', 'member'
 * - Empty array: skip workspace deletion
 */
export const AdminBanUserInputSchema = z.object({
  params: z.object({
    userId: UserIdSchema,
  }),
  body: z.object({
    reason: ReasonTextSchema,
    expiresInSeconds: z.number().int().positive().optional(),
    deleteWorkspacesForRoles: z.array(z.enum(WORKSPACE_ROLE_VALUES)).optional().default(['owner']),
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
  joinedAt: z.coerce.date(),
});

/**
 * Admin workspace in list view
 */
export const AdminWorkspaceListItemSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  workspaceName: z.string(),
  createdAt: z.coerce.date(),
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
  createdAt: z.coerce.date(),
  isDeleted: z.boolean(),
  deletedAt: z.coerce.date().nullable(),
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
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
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
  body: z
    .object({
      notify: z.enum(ADMIN_NOTIFY_DURATION_VALUES).optional(),
    })
    .optional(),
});

/**
 * Restore workspace input
 */
export const AdminRestoreWorkspaceInputSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  body: z
    .object({
      notify: z.enum(ADMIN_NOTIFY_DURATION_VALUES).optional(),
    })
    .optional(),
});

/**
 * Restore workspace response data
 */
export const AdminRestoreWorkspaceDataSchema = z.object({
  workspace: z.object({
    workspaceId: WorkspaceIdSchema,
    workspaceName: z.string(),
    isDeleted: z.boolean(),
    deletedAt: z.coerce.date().nullable(),
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
  body: z
    .object({
      notify: z.enum(ADMIN_NOTIFY_DURATION_VALUES).optional(),
    })
    .optional(),
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
  body: z
    .object({
      notify: z.enum(ADMIN_NOTIFY_DURATION_VALUES).optional(),
    })
    .optional(),
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
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
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
// ADMIN ENTITLEMENT SCHEMAS
// ============================================

/**
 * Admin entitlement item (for response)
 */
export const AdminEntitlementSchema = z.object({
  resourceType: z.enum(RESOURCE_TYPE_VALUES),
  quotedLimit: z.number(),
  actualLimit: z.number(),
  resourceConsumed: z.number(),
});

/**
 * Get entitlements input
 */
export const AdminGetEntitlementsInputSchema = z.object({
  params: z.object({ workspaceId: WorkspaceIdSchema }),
});

/**
 * Entitlements response data
 */
export const AdminEntitlementsDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  entitlements: z.array(AdminEntitlementSchema),
});

/**
 * Update entitlement item (partial limit updates)
 */
export const AdminUpdateEntitlementItemSchema = z.object({
  resourceType: z.enum(RESOURCE_TYPE_VALUES),
  quotedLimit: z.number().int().optional(), // -1 allowed for unlimited
  actualLimit: z.number().int().optional(), // -1 allowed for unlimited
});

/**
 * Update entitlements input
 */
export const AdminUpdateEntitlementsInputSchema = z.object({
  params: z.object({ workspaceId: WorkspaceIdSchema }),
  body: z.object({
    entitlements: z.array(AdminUpdateEntitlementItemSchema).min(1),
  }),
});

// ============================================
// WORKSPACE INVITE SCHEMAS
// ============================================

/**
 * Admin create workspace invite input
 * Workspaces start on free plan - no plan selection needed
 */
export const AdminCreateWorkspaceInviteInputSchema = z.object({
  body: z.object({
    workspaceUrl: z.string().url('Invalid URL'),
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
});

/**
 * Types - Workspace Invite
 */
export type AdminCreateWorkspaceInviteInput = z.infer<typeof AdminCreateWorkspaceInviteInputSchema>;
export type AdminCreateWorkspaceInviteData = z.infer<typeof AdminCreateWorkspaceInviteDataSchema>;

/**
 * Types - Entitlements
 */
export type AdminEntitlement = z.infer<typeof AdminEntitlementSchema>;
export type AdminGetEntitlementsInput = z.infer<typeof AdminGetEntitlementsInputSchema>;
export type AdminEntitlementsData = z.infer<typeof AdminEntitlementsDataSchema>;
export type AdminUpdateEntitlementItem = z.infer<typeof AdminUpdateEntitlementItemSchema>;
export type AdminUpdateEntitlementsInput = z.infer<typeof AdminUpdateEntitlementsInputSchema>;

// ============================================
// ADMIN PLAN MANAGEMENT SCHEMAS
// ============================================

const TIME_INTERVAL_VALUES = ['Day', 'Week', 'Month', 'Year'] as const;
const AdminPlanNameSchema = NameSchema.max(100);
const AdminPlanDescriptionSchema = z.string().max(1000);
export const AdminPlanBillingCycleSchema = z.enum(['monthly', 'annual']);

/** Price configuration for plan product */
export const AdminPlanPriceSchema = z.object({
  type: z.enum(['one_time_price', 'recurring_price']),
  currency: z.string(),
  price: z.number(),
  discount: z.number().default(0),
  taxInclusive: z.boolean().nullable().optional(),
  paymentFrequencyCount: z.number().optional(),
  paymentFrequencyInterval: z.enum(TIME_INTERVAL_VALUES).optional(),
  subscriptionPeriodCount: z.number().optional(),
  subscriptionPeriodInterval: z.enum(TIME_INTERVAL_VALUES).optional(),
  trialPeriodDays: z.number().optional(),
});

/** Constrained recurring price input for admin plan creation/update */
export const AdminPlanRecurringPriceInputSchema = z.object({
  amountCents: z.number().int().nonnegative(),
  billingCycle: AdminPlanBillingCycleSchema,
  taxInclusive: z.boolean().nullable().optional(),
});

/** Resource limit in plan metadata (decoded) */
export const AdminPlanResourceLimitSchema = z.object({
  resourceType: z.enum(RESOURCE_TYPE_VALUES),
  quotedLimit: z.number().int(),
  actualLimit: z.number().int(),
});

/** Feature gate in plan metadata (decoded) */
export const AdminPlanFeatureGateSchema = z.object({
  gate: z.string(),
  label: z.string(),
  enabled: z.boolean(),
});

/** Feature gate input shape for create/update plan payloads */
export const AdminPlanFeatureGateInputSchema = z.object({
  gate: z.enum(FEATURE_GATE_KEYS),
  enabled: z.boolean(),
});

/** Plan product in list/detail response */
export const AdminPlanProductSchema = z.object({
  productId: z.string(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  isRecurring: z.boolean(),
  price: AdminPlanPriceSchema.nullable(),
  featureLimits: z.array(AdminPlanResourceLimitSchema).nullable(),
  featureGates: z.array(AdminPlanFeatureGateSchema).nullable(),
  hasMetadata: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** List plans input */
export const AdminListPlansInputSchema = z.object({
  query: z
    .object({
      pageNumber: z.coerce.number().int().min(0).optional().default(0),
      pageSize: z.coerce.number().int().min(1).max(10).optional().default(5),
    })
    .optional()
    .default({}),
});

/** List plans response */
export const AdminPlansListDataSchema = z.object({
  products: z.array(AdminPlanProductSchema),
  pageNumber: z.number(),
  pageSize: z.number(),
});

/** Get plan input */
export const AdminGetPlanInputSchema = z.object({
  params: z.object({ productId: z.string() }),
});

/** Create plan input */
export const AdminCreatePlanInputSchema = z.object({
  body: z.object({
    name: AdminPlanNameSchema,
    description: AdminPlanDescriptionSchema.optional(),
    price: AdminPlanRecurringPriceInputSchema,
    featureLimits: z.array(AdminPlanResourceLimitSchema),
    featureGates: z.array(AdminPlanFeatureGateInputSchema),
  }),
});

/** Update plan input */
export const AdminUpdatePlanInputSchema = z.object({
  params: z.object({ productId: z.string() }),
  body: z.object({
    name: AdminPlanNameSchema.optional(),
    description: AdminPlanDescriptionSchema.nullable().optional(),
    price: AdminPlanRecurringPriceInputSchema.optional(),
    featureLimits: z.array(AdminPlanResourceLimitSchema).optional(),
    featureGates: z.array(AdminPlanFeatureGateInputSchema).optional(),
  }),
});

// ============================================
// ADMIN WORKSPACE PROVISIONING SCHEMAS
// ============================================

const AdminProvisionNameSchema = NameSchema.max(100);
const AdminProvisionWorkspaceDomainSchema = DomainUrlSchema;

/** Custom plan input (for inline plan creation during workspace provisioning) */
export const AdminWorkspaceProvisionCustomPlanSchema = z
  .object({
    price: AdminPlanRecurringPriceInputSchema,
    featureLimits: z.array(AdminPlanResourceLimitSchema),
    featureGates: z.array(AdminPlanFeatureGateInputSchema),
  })
  .strict();

const AdminWorkspaceProvisionBaseBodySchema = z
  .object({
    email: EmailSchema,
    name: AdminProvisionNameSchema,
    workspaceDomain: AdminProvisionWorkspaceDomainSchema,
    workspaceName: AdminProvisionNameSchema.optional(),
  })
  .strict();

const defaultTrialPeriod = String(
  DEFAULT_TRIAL_PERIOD_DAYS
) as (typeof ADMIN_TRIAL_PERIOD_VALUES)[number];

const AdminWorkspaceProvisionPlanSelectionSchema = z.discriminatedUnion('planMode', [
  z.object({ planMode: z.literal('free') }).strict(),
  z
    .object({
      planMode: z.literal('existing'),
      productId: z.string().min(1),
      trialPeriodDays: z.enum(ADMIN_TRIAL_PERIOD_VALUES).optional().default(defaultTrialPeriod),
    })
    .strict(),
  z
    .object({
      planMode: z.literal('custom'),
      customPlan: AdminWorkspaceProvisionCustomPlanSchema,
      trialPeriodDays: z.enum(ADMIN_TRIAL_PERIOD_VALUES).optional().default(defaultTrialPeriod),
    })
    .strict(),
]);

/** Workspace provisioning input */
export const AdminWorkspaceProvisionInputSchema = z.object({
  body: AdminWorkspaceProvisionBaseBodySchema.and(AdminWorkspaceProvisionPlanSelectionSchema),
});

/** Workspace provisioning response data */
export const AdminWorkspaceProvisionDataSchema = z.object({
  checkoutUrl: z.string().nullable(),
  workspaceUrl: URLSchema,
  workspaceId: WorkspaceIdSchema,
  workspaceName: AdminProvisionNameSchema,
  userId: UserIdSchema,
  isNewUser: z.boolean(),
});

/**
 * Types - Workspace Provisioning
 */
export type AdminWorkspaceProvisionInput = z.infer<typeof AdminWorkspaceProvisionInputSchema>;
export type AdminWorkspaceProvisionData = z.infer<typeof AdminWorkspaceProvisionDataSchema>;

// ============================================
// ADMIN SUBSCRIPTION UPDATE SCHEMAS
// ============================================

/**
 * Admin subscription update input
 * Allows partial overrides of feature gates and/or entitlements.
 * Changes are routed through DodoPayments (eventual consistency via webhooks).
 */
export const AdminUpdateSubscriptionInputSchema = z.object({
  params: z.object({ workspaceId: WorkspaceIdSchema }),
  body: z
    .object({
      featureGates: FeatureGatesSchema.partial().optional(),
      entitlements: z
        .record(
          z.enum(RESOURCE_TYPE_VALUES),
          z
            .object({
              quotedLimit: z.number().int().min(-1),
              actualLimit: z.number().int().min(-1),
            })
            .partial()
        )
        .optional(),
    })
    .refine((data) => data.featureGates || data.entitlements, {
      message: 'At least one of featureGates or entitlements must be provided',
    }),
});

/**
 * Admin subscription update response data
 */
export const AdminUpdateSubscriptionDataSchema = z.object({
  subscriptionId: z.string(),
  updated: z.boolean(),
});

// ============================================
// ADMIN WORKSPACE SUBSCRIPTION SCHEMAS
// ============================================

/**
 * Admin workspace subscription data
 * Combines contract detail, access detail, feature gates, and add-on status
 */
export const AdminWorkspaceSubscriptionDataSchema = z.object({
  contractDetail: ContractDetailSchema,
  accessDetail: AccessDetailSchema,
  featureGates: FeatureGatesSchema,
  addons: AddonsStatusDataSchema.omit({ subscriptionId: true })
    .extend({ subscriptionId: z.string().optional() })
    .nullable(),
});

/**
 * Get workspace subscription input
 */
export const AdminGetWorkspaceSubscriptionInputSchema = z.object({
  params: z.object({ workspaceId: WorkspaceIdSchema }),
});

/**
 * Types - Workspace Subscription
 */
export type AdminWorkspaceSubscriptionData = z.infer<typeof AdminWorkspaceSubscriptionDataSchema>;
export type AdminGetWorkspaceSubscriptionInput = z.infer<
  typeof AdminGetWorkspaceSubscriptionInputSchema
>;

/**
 * Types - Plans
 */
export type AdminPlanPrice = z.infer<typeof AdminPlanPriceSchema>;
export type AdminPlanRecurringPriceInput = z.infer<typeof AdminPlanRecurringPriceInputSchema>;
export type AdminPlanResourceLimit = z.infer<typeof AdminPlanResourceLimitSchema>;
export type AdminPlanFeatureGate = z.infer<typeof AdminPlanFeatureGateSchema>;
export type AdminPlanProduct = z.infer<typeof AdminPlanProductSchema>;
export type AdminPlansListData = z.infer<typeof AdminPlansListDataSchema>;
export type AdminListPlansInput = z.infer<typeof AdminListPlansInputSchema>;
export type AdminGetPlanInput = z.infer<typeof AdminGetPlanInputSchema>;
export type AdminCreatePlanInput = z.infer<typeof AdminCreatePlanInputSchema>;
export type AdminUpdatePlanInput = z.infer<typeof AdminUpdatePlanInputSchema>;
export type AdminWorkspaceProvisionCustomPlan = z.infer<
  typeof AdminWorkspaceProvisionCustomPlanSchema
>;

/**
 * Types - Subscription Update
 */
export type AdminUpdateSubscriptionInput = z.infer<typeof AdminUpdateSubscriptionInputSchema>;
export type AdminUpdateSubscriptionData = z.infer<typeof AdminUpdateSubscriptionDataSchema>;
