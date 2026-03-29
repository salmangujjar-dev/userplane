import { z } from 'zod';

import {
  DOMAIN_PAGINATION,
  MAX_EMAIL_DOMAINS,
  SEARCH_PAGINATION,
  WORKSPACE_MEMBERS_PAGINATION,
  WORKSPACE_PAGINATION,
  WORKSPACE_SUGGESTIONS_PAGINATION,
} from '../constants';
import {
  DomainIdSchema,
  DomainStatusSchema,
  DomainUrlSchema,
  EmailDomainSchema,
  PaginationMetaSchema,
  RestorationStatusSchema,
  SearchQuerySchema,
  SortDirectionSchema,
  TokenSchema,
  UserIdSchema,
  WorkspaceIdSchema,
  WorkspaceInvitePolicySchema,
  WorkspaceMemberIdSchema,
  WorkspaceRoleSchema,
} from './common';

/**
 * Workspace schemas
 */

// ============================================================================
// WORKSPACE-SPECIFIC VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for workspace name validation
 * Trims whitespace and validates the trimmed value
 */
export const WorkspaceNameSchema = z
  .string()
  .trim()
  .min(1, 'Workspace name is required')
  .min(2, 'Workspace name must be at least 2 characters')
  .max(100, 'Workspace name must be less than 100 characters');

/**
 * Schema for company name validation
 * Trims whitespace and validates the trimmed value
 */
export const CompanyNameSchema = z
  .string()
  .trim()
  .min(1, 'Company name is required')
  .max(100, 'Company name must be less than 100 characters');

/**
 * Schema for recording header text
 */
export const RecordingHeaderSchema = z
  .string()
  .max(200, 'Header must be less than 200 characters')
  .trim()
  .optional();

/**
 * Schema for recording footnote text
 */
export const RecordingFootnoteSchema = z
  .string()
  .max(500, 'Footnote must be less than 500 characters')
  .trim()
  .optional();

/**
 * Schema for hex color validation
 */
export const HexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Please enter a valid hex color (e.g., #FF5733)')
  .transform((val) => val.toUpperCase());

// ============================================================================
// WORKSPACE DATA SCHEMAS
// ============================================================================

/**
 * Workspace notification preferences
 */
export const WorkspaceNotificationPreferencesSchema = z.object({
  notifyFeatureHighlights: z.boolean(),
  notifyUsageEvents: z.boolean(),
  notifyIncomingEvents: z.boolean(),
  notifyAdminEvents: z.boolean(),
});

/**
 * Type inference from schema
 */
export type WorkspaceNotificationPreferences = z.infer<
  typeof WorkspaceNotificationPreferencesSchema
>;

/**
 * Notification field metadata for UI rendering
 */
export interface NotificationFieldMetadata {
  key: keyof WorkspaceNotificationPreferences;
  id: string;
  label: string;
  description: string;
  visibleForRoles: Array<'owner' | 'admin' | 'member'>;
  defaultForRoles: {
    owner: boolean;
    admin: boolean;
    member: boolean;
  };
}

/**
 * Notification configuration with metadata
 * Single source of truth for all notification preferences
 */
export const NOTIFICATION_FIELDS: readonly NotificationFieldMetadata[] = [
  {
    key: 'notifyFeatureHighlights',
    id: 'feature-highlights',
    label: 'Feature highlights',
    description: 'Get notified about new features and updates',
    visibleForRoles: ['owner', 'admin', 'member'],
    defaultForRoles: {
      owner: true,
      admin: true,
      member: true,
    },
  },
  {
    key: 'notifyUsageEvents',
    id: 'usage-events',
    label: 'Usage notifications',
    description: 'Get alerts about workspace usage and quota limits',
    // Owners cannot opt out of this notification, so it is hidden from them
    visibleForRoles: ['admin', 'member'],
    defaultForRoles: {
      owner: true,
      admin: true,
      member: true,
    },
  },
  {
    key: 'notifyIncomingEvents',
    id: 'incoming-events',
    label: 'Incoming recordings',
    description: 'Notify about new recordings and screenshots',
    visibleForRoles: ['owner', 'admin', 'member'],
    // Disabled by default to avoid spamming users
    defaultForRoles: {
      owner: false,
      admin: false,
      member: false,
    },
  },
  {
    key: 'notifyAdminEvents',
    id: 'admin-events',
    label: 'Admin notifications',
    description: 'Receive workspace administration and member activity alerts',
    // Owners cannot opt out (always on, hidden from them)
    // Members cannot opt in (always off, hidden from them)
    // Only admins can toggle this preference
    visibleForRoles: ['admin'],
    // Admins are not notified by default to avoid spamming them
    defaultForRoles: {
      owner: true,
      admin: false,
      member: false,
    },
  },
] as const;

/**
 * Helper to get default notification preferences for a role
 */
export function getDefaultNotificationPreferences(
  role: 'owner' | 'admin' | 'member'
): WorkspaceNotificationPreferences {
  return NOTIFICATION_FIELDS.reduce((acc, field) => {
    acc[field.key] = field.defaultForRoles[role];
    return acc;
  }, {} as WorkspaceNotificationPreferences);
}

/**
 * Helper to get visible notification fields for a role
 */
export function getVisibleNotificationFields(
  role: 'owner' | 'admin' | 'member'
): readonly NotificationFieldMetadata[] {
  return NOTIFICATION_FIELDS.filter((field) => field.visibleForRoles.includes(role));
}

/**
 * Helper to get notification keys a role is allowed to change.
 * visible = editable; hidden fields are enforced by the backend.
 */
export function getEditableNotificationKeys(
  role: 'owner' | 'admin' | 'member'
): Array<keyof WorkspaceNotificationPreferences> {
  return NOTIFICATION_FIELDS.filter((f) => f.visibleForRoles.includes(role)).map((f) => f.key);
}

/**
 * Helper to get the locked (non-editable) notification overrides for a role.
 * Returns the default values for keys the role cannot edit.
 * Used to force correct values on role transitions.
 */
export function getLockedNotificationOverrides(
  role: 'owner' | 'admin' | 'member'
): Partial<WorkspaceNotificationPreferences> {
  const editable = new Set(getEditableNotificationKeys(role));
  const overrides: Partial<WorkspaceNotificationPreferences> = {};
  for (const field of NOTIFICATION_FIELDS) {
    if (!editable.has(field.key)) {
      overrides[field.key] = field.defaultForRoles[role];
    }
  }
  return overrides;
}

/**
 * Workspace membership
 */
export const WorkspaceMembershipSchema = z.object({
  workspaceMemberId: WorkspaceMemberIdSchema,
  workspaceRole: WorkspaceRoleSchema,
  workspaceJoinedAt: z.coerce.date(),
});

/**
 * Workspace item
 */
export const WorkspaceItemSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  workspaceName: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  workspaceMembership: WorkspaceMembershipSchema.optional(),
});

/**
 * Workspaces list query parameters (detailed mode)
 */
export const ListWorkspacesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    per_page: z.coerce
      .number()
      .int()
      .min(WORKSPACE_PAGINATION.MIN_PER_PAGE)
      .max(WORKSPACE_PAGINATION.MAX_PER_PAGE)
      .optional()
      .default(WORKSPACE_PAGINATION.DEFAULT_PER_PAGE),
    include_workspace_membership: z.coerce.boolean().optional().default(false),
  }),
});

/**
 * Workspaces list response
 */
export const WorkspacesListDataSchema = z.object({
  workspaces: z.array(WorkspaceItemSchema),
  total: z.number().int().nonnegative(),
  pagination: PaginationMetaSchema,
});

/**
 * Count workspaces query parameters (detailed mode)
 */
export const CountWorkspacesQuerySchema = z.object({
  query: z.object({
    roles: z.array(WorkspaceRoleSchema).optional(),
  }),
});

/**
 * Workspace count response
 */
export const WorkspaceCountDataSchema = z.object({
  count: z.number().int().nonnegative(),
});

/**
 * Workspace by ID request (detailed mode)
 */
export const WorkspaceByIdSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * Workspace by ID response
 */
export const WorkspaceByIdDataSchema = z.object({
  workspace: z.object({
    workspaceId: WorkspaceIdSchema,
    workspaceName: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  }),
});

/**
 * Workspace resources count query parameters (detailed mode)
 */
export const WorkspaceResourcesCountQuerySchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  query: z.object({
    include_projects: z.coerce.boolean().optional().default(false),
    include_recordings: z.coerce.boolean().optional().default(false),
    include_active_recordings: z.coerce.boolean().optional().default(false),
    include_links: z.coerce.boolean().optional().default(false),
    include_domains: z.coerce.boolean().optional().default(false),
    include_members: z.coerce.boolean().optional().default(false),
  }),
});

/**
 * Workspace resources count response
 */
export const WorkspaceResourcesCountDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  counts: z.object({
    projects: z.number().int().nonnegative().optional(),
    recordings: z.number().int().nonnegative().optional(),
    activeRecordings: z.number().int().nonnegative().optional(),
    links: z.number().int().nonnegative().optional(),
    domains: z.number().int().nonnegative().optional(),
    members: z.number().int().nonnegative().optional(),
  }),
});

/**
 * Workspace preferences
 */
export const WorkspacePreferencesSchema = z.object({
  recordingCustomizeLink: z.boolean(),
  recordingCompanyName: z.string().nullable(),
  recordingCompanyLogoPath: z.string().nullable(),
  recordingHeader: z.string().nullable(),
  recordingFootnote: z.string().nullable(),
  recordingPrimaryColor: z.string().nullable(),
  recordingMaxDurationMs: z.number().int().nullable(),
  recordingSlug: z.string().nullable(),
});

/**
 * Workspace preferences get request (detailed mode)
 */
export const WorkspacePreferencesGetSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * Workspace preferences get response
 */
export const WorkspacePreferencesGetDataSchema = z.object({
  preferences: WorkspacePreferencesSchema,
});

/**
 * Update workspace preferences request (detailed mode)
 */
export const UpdateWorkspacePreferencesSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  body: z.object({
    recordingCustomizeLink: z.boolean().optional(),
    recordingCompanyName: z.string().nullable().optional(),
    recordingCompanyLogoPath: z.string().nullable().optional(),
    recordingHeader: z.string().nullable().optional(),
    recordingFootnote: z.string().nullable().optional(),
    recordingPrimaryColor: z.string().nullable().optional(),
    recordingMaxDurationMs: z.number().int().nullable().optional(),
  }),
});

/**
 * Workspace preferences update response
 */
export const WorkspacePreferencesUpdateDataSchema = z.object({
  preferences: z.object({
    workspaceId: WorkspaceIdSchema,
    workspaceName: z.string(),
    recordingCustomizeLink: z.boolean(),
    recordingCompanyName: z.string().nullable(),
    recordingCompanyLogoPath: z.string().nullable(),
    recordingHeader: z.string().nullable(),
    recordingFootnote: z.string().nullable(),
    recordingPrimaryColor: z.string().nullable(),
    recordingMaxDurationMs: z.number().int().nullable(),
  }),
});

/**
 * Workspace member
 * Represents a member of a workspace with their role
 */
export const WorkspaceMemberSchema = z.object({
  workspaceMemberId: WorkspaceMemberIdSchema,
  memberName: z.string(),
  memberEmail: z.string().email(),
  workspaceRole: WorkspaceRoleSchema,
});

/**
 * Workspace team query parameters (detailed mode)
 */
export const WorkspaceTeamQuerySchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    per_page: z.coerce
      .number()
      .int()
      .min(WORKSPACE_MEMBERS_PAGINATION.MIN_PER_PAGE)
      .max(WORKSPACE_MEMBERS_PAGINATION.MAX_PER_PAGE)
      .optional()
      .default(WORKSPACE_MEMBERS_PAGINATION.DEFAULT_PER_PAGE),
  }),
});

/**
 * Workspace team response
 */
export const WorkspaceTeamDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  workspaceMembers: z.array(WorkspaceMemberSchema),
  pagination: PaginationMetaSchema,
});

/**
 * Get workspace membership request (detailed mode)
 */
export const GetWorkspaceMembershipSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * Workspace membership response
 */
export const WorkspaceMembershipDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  workspaceMembership: WorkspaceMembershipSchema,
});

/**
 * Update member role request (detailed mode)
 */
export const UpdateMemberRoleSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    workspaceMemberId: WorkspaceMemberIdSchema,
  }),
  body: z.object({
    role: WorkspaceRoleSchema,
  }),
});

/**
 * Member role update response
 */
export const MemberRoleUpdateDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  workspaceMemberId: WorkspaceMemberIdSchema,
  workspaceRole: WorkspaceRoleSchema,
});

/**
 * Member remove request (detailed mode)
 */
export const RemoveMemberSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    workspaceMemberId: WorkspaceMemberIdSchema,
  }),
});

/**
 * Member remove response
 */
export const MemberRemoveDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  workspaceMemberId: WorkspaceMemberIdSchema,
});

/**
 * Leave workspace request (detailed mode)
 */
export const LeaveWorkspaceSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * Leave workspace response
 */
export const LeaveWorkspaceDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  workspaceDeleted: z.boolean().optional(),
});

/**
 * Get notification preferences request (detailed mode)
 */
export const GetNotificationPreferencesSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * Notification preferences get response
 */
export const NotificationPreferencesGetDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  notificationPreferences: WorkspaceNotificationPreferencesSchema,
});

/**
 * Update notification preferences request (detailed mode)
 */
export const UpdateNotificationPreferencesSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  body: z.object({
    notifyFeatureHighlights: z.boolean().optional(),
    notifyUsageEvents: z.boolean().optional(),
    notifyIncomingEvents: z.boolean().optional(),
    notifyAdminEvents: z.boolean().optional(),
  }),
});

/**
 * Notification preferences update response
 */
export const NotificationPreferencesUpdateDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
});

/**
 * Domain item
 */
export const DomainItemSchema = z.object({
  domainId: DomainIdSchema,
  domainUrl: z.string(),
  domainStatus: DomainStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Domain sort fields
 */
export const DomainSortFieldSchema = z.enum(['created_at', 'domain_url']);

/**
 * Workspace domains query parameters (detailed mode)
 */
export const WorkspaceDomainsQuerySchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    per_page: z.coerce
      .number()
      .int()
      .min(DOMAIN_PAGINATION.MIN_PER_PAGE)
      .max(DOMAIN_PAGINATION.MAX_PER_PAGE)
      .optional()
      .default(DOMAIN_PAGINATION.DEFAULT_PER_PAGE),
    sort_by: DomainSortFieldSchema.optional().default('created_at'),
    sort_direction: SortDirectionSchema.optional().default('desc'),
  }),
});

/**
 * Workspace domains response
 */
export const WorkspaceDomainsDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  domains: z.array(DomainItemSchema),
  pagination: PaginationMetaSchema,
});

/**
 * Domain by ID request (detailed mode)
 */
export const DomainByIdSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    domainId: DomainIdSchema,
  }),
});

/**
 * Domain by ID response
 */
export const DomainByIdDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  domain: z.object({
    domainId: DomainIdSchema,
    domainUrl: z.string(),
    domainStatus: DomainStatusSchema,
    recordingHideSensitive: z.boolean(),
    recordingCaptureClientLog: z.boolean(),
    recordingCaptureClientAction: z.boolean(),
    recordingCaptureServerLog: z.boolean(),
    recordingCaptureNetworkLog: z.boolean(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  }),
});

/**
 * Add domain request (detailed mode)
 */
export const AddDomainSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  body: z.object({
    url: DomainUrlSchema,
  }),
});

/**
 * Domain add response
 */
export const DomainAddDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  domain: DomainItemSchema,
});

/**
 * Update domain request (detailed mode)
 */
export const UpdateDomainSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    domainId: DomainIdSchema,
  }),
  body: z.object({
    url: DomainUrlSchema,
  }),
});

/**
 * Domain update response
 */
export const DomainUpdateDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  domain: DomainItemSchema,
});

/**
 * Domain delete request (detailed mode)
 */
export const DeleteDomainSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    domainId: DomainIdSchema,
  }),
});

/**
 * Domain delete response
 */
export const DomainDeleteDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  domainId: DomainIdSchema,
});

/**
 * Domain verification URL request (detailed mode)
 */
export const DomainVerificationUrlSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    domainId: DomainIdSchema,
  }),
});

/**
 * Domain verification URL response
 */
export const DomainVerificationUrlDataSchema = z.object({
  verificationUrl: z.string(),
  domainUrl: z.string(),
});

/**
 * Invite URL request (detailed mode)
 */
export const InviteUrlSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * Invite URL response
 */
export const InviteUrlDataSchema = z.object({
  inviteUrl: z.string(),
  workspaceId: WorkspaceIdSchema,
});

/**
 * Update link settings request (detailed mode)
 */
export const UpdateLinkSettingsSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  body: z.object({
    recordingCompanyName: z.string().nullable().optional(),
    recordingHeader: z.string().nullable().optional(),
    recordingFootnote: z.string().nullable().optional(),
    recordingPrimaryColor: z.string().nullable().optional(),
    recordingMaxDurationMs: z.number().int().positive().nullable().optional(),
  }),
});

/**
 * Link settings response
 */
export const LinkSettingsDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  recordingCompanyName: z.string().nullable(),
  recordingCompanyLogoPath: z.string().nullable(),
  recordingHeader: z.string().nullable(),
  recordingFootnote: z.string().nullable(),
  recordingPrimaryColor: z.string().nullable(),
  recordingMaxDurationMs: z.number().int().nullable(),
  recordingCustomizeLink: z.boolean(),
  recordingSlug: z.string().nullable(),
});

/**
 * Update workspace name request (detailed mode)
 */
export const UpdateWorkspaceNameSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  body: z.object({
    name: WorkspaceNameSchema,
  }),
});

/**
 * Workspace name update response
 */
export const WorkspaceNameUpdateDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  workspaceName: z.string(),
});

/**
 * Workspace delete request (detailed mode)
 */
export const DeleteWorkspaceSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * Workspace delete response
 */
export const WorkspaceDeleteDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  success: z.boolean(),
});

/**
 * Get workspace restore info request (detailed mode)
 */
export const GetWorkspaceRestoreInfoSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * Workspace restore info response
 */
export const WorkspaceRestoreInfoDataSchema = z.object({
  restoration: RestorationStatusSchema,
  reason: z.string().optional(),
  workspace: z.object({
    workspaceId: WorkspaceIdSchema,
    workspaceName: z.string(),
    isDeleted: z.boolean(),
    deletedAt: z.coerce.date().nullable(),
    deletedSince: z.number().nullable(),
  }),
  projectsToRestore: z.number().int().nonnegative(),
  linksToRestore: z.number().int().nonnegative(),
  membersToRestore: z.number().int().nonnegative(),
  recordingsToRestore: z.number().int().nonnegative(),
  integrationsToRestore: z.number().int().nonnegative(),
});

/**
 * Type inference from WorkspaceRestoreInfoDataSchema
 */
export type WorkspaceRestoreInfoData = z.infer<typeof WorkspaceRestoreInfoDataSchema>;

/**
 * Restore workspace request (detailed mode)
 */
export const RestoreWorkspaceSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * Workspace restore response
 */
export const WorkspaceRestoreDataSchema = z.object({
  restorationStatus: RestorationStatusSchema,
  workspace: z.object({
    workspaceId: WorkspaceIdSchema,
    workspaceName: z.string(),
    isDeleted: z.boolean(),
    deletedAt: z.coerce.date().nullable(),
    deletedSince: z.number().nullable(),
  }),
  restoredProjects: z.number().int().nonnegative(),
  restoredLinks: z.number().int().nonnegative(),
  restoredMembers: z.number().int().nonnegative(),
  restoredRecordings: z.number().int().nonnegative(),
  restoredIntegrations: z.number().int().nonnegative(),
});

/**
 * Type inference from WorkspaceRestoreDataSchema
 */
export type WorkspaceRestoreData = z.infer<typeof WorkspaceRestoreDataSchema>;

/**
 * Type inference from WorkspaceMemberSchema
 */
export type WorkspaceMember = z.infer<typeof WorkspaceMemberSchema>;

/**
 * Type inference from WorkspaceTeamDataSchema
 */
export type WorkspaceTeamData = z.infer<typeof WorkspaceTeamDataSchema>;

/**
 * Workspace search query parameters (detailed mode)
 */
export const WorkspaceSearchQuerySchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  query: z.object({
    q: SearchQuerySchema,
    type: z.enum(['members', 'projects', 'domains', 'links']),
    limit: z.coerce
      .number()
      .int()
      .min(SEARCH_PAGINATION.MIN_LIMIT)
      .max(SEARCH_PAGINATION.MAX_LIMIT)
      .optional()
      .default(SEARCH_PAGINATION.DEFAULT_LIMIT),
  }),
});

/**
 * Workspace search response
 */
export const WorkspaceSearchDataSchema = z.object({
  results: z.array(z.unknown()),
});

/**
 * Workspace invite policy settings schema
 */
export const WorkspaceInvitePolicySettingsSchema = z.object({
  workspaceInvitePolicy: WorkspaceInvitePolicySchema,
  workspaceInviteDomains: z.array(z.string()).nullable(),
});

/**
 * Get workspace invite policy request (detailed mode)
 */
export const GetInvitePolicySchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * Get workspace invite policy response
 */
export const InvitePolicyDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  workspaceInvitePolicy: WorkspaceInvitePolicySchema,
  workspaceInviteDomains: z.array(z.string()).nullable(),
});

/**
 * Update workspace invite policy request (detailed mode)
 */
export const UpdateInvitePolicySchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  body: z.object({
    workspaceInvitePolicy: WorkspaceInvitePolicySchema,
    workspaceInviteDomains: z
      .array(EmailDomainSchema)
      .max(MAX_EMAIL_DOMAINS, `Maximum ${MAX_EMAIL_DOMAINS} email domains allowed per workspace`)
      .nullable()
      .optional(),
  }),
});

/**
 * Update workspace invite policy response
 */
export const InvitePolicyUpdateDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  workspaceInvitePolicy: WorkspaceInvitePolicySchema,
  workspaceInviteDomains: z.array(z.string()).nullable(),
});

/**
 * Suggested workspace item for users without workspaces
 */
export const SuggestedWorkspaceItemSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  workspaceName: z.string(),
  workspaceInvitePolicy: WorkspaceInvitePolicySchema,
  // Action the user can take: 'join' for whitelisted, 'request' for protected
  action: z.enum(['join', 'request']),
});

/**
 * Suggest workspaces query parameters
 */
export const SuggestWorkspacesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    per_page: z.coerce
      .number()
      .int()
      .min(WORKSPACE_SUGGESTIONS_PAGINATION.MIN_PER_PAGE)
      .max(WORKSPACE_SUGGESTIONS_PAGINATION.MAX_PER_PAGE)
      .optional()
      .default(WORKSPACE_SUGGESTIONS_PAGINATION.DEFAULT_PER_PAGE),
  }),
});

/**
 * Suggest workspaces response
 */
export const SuggestWorkspacesDataSchema = z.object({
  workspaces: z.array(SuggestedWorkspaceItemSchema),
  pagination: PaginationMetaSchema,
});

/**
 * Join workspace request (detailed mode)
 */
export const JoinWorkspaceSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * Join workspace response
 * Discriminated union based on whether user was already a member
 */
export const JoinWorkspaceDataSchema = z.discriminatedUnion('alreadyMember', [
  z.object({
    alreadyMember: z.literal(false),
    workspaceId: WorkspaceIdSchema,
    workspaceName: z.string(),
    // Status: 'joined' if user was added, 'requested' if access request was sent
    status: z.enum(['joined', 'requested']),
  }),
  z.object({
    alreadyMember: z.literal(true),
    workspaceId: WorkspaceIdSchema,
    workspaceName: z.string(),
    status: z.literal('joined'),
  }),
]);

/**
 * Validate access request schema (via token in query)
 */
export const ValidateAccessRequestSchema = z.object({
  query: z.object({
    token: TokenSchema,
  }),
});

/**
 * Validate access request response - contains details for the review page
 */
export const ValidateAccessRequestDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  workspaceName: z.string(),
  requesterUserId: UserIdSchema,
  requesterEmail: z.string(),
  requesterName: z.string().nullable(),
});

/**
 * Approve access request schema (via token in body)
 */
export const ApproveAccessRequestSchema = z.object({
  body: z.object({
    token: TokenSchema,
  }),
});

/**
 * Approve access request response
 */
export const ApproveAccessRequestDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  workspaceName: z.string(),
  userId: UserIdSchema,
  userEmail: z.string(),
  status: z.literal('approved'),
});

/**
 * Decline access request schema (via token in body)
 */
export const DeclineAccessRequestSchema = z.object({
  body: z.object({
    token: TokenSchema,
  }),
});

/**
 * Decline access request response
 */
export const DeclineAccessRequestDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  workspaceName: z.string(),
  userId: UserIdSchema,
  userEmail: z.string(),
  status: z.literal('declined'),
});

/**
 * Workspace access status values
 * - 'member': User is already a member, can access workspace
 * - 'can_join': User can join directly (whitelisted policy + domain match)
 * - 'can_request': User can request access (protected policy + domain match)
 * - 'no_access': User cannot access (private or domain mismatch)
 */
export const WorkspaceAccessStatusSchema = z.enum([
  'member',
  'can_join',
  'can_request',
  'no_access',
]);

/**
 * Get workspace status request (detailed mode)
 * Used to check access status without requiring membership
 */
export const GetWorkspaceStatusSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * Workspace status response
 * Returns minimal workspace info and access status for the current user
 * Handles soft-deleted workspaces gracefully instead of throwing
 */
export const WorkspaceStatusDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  workspaceName: z.string(),
  isDeleted: z.boolean(),
  invitePolicy: WorkspaceInvitePolicySchema.nullable(),
  accessStatus: WorkspaceAccessStatusSchema,
});

// ============================================================================
// INTEGRATION SCHEMAS
// ============================================================================

/**
 * Integration status response
 * Indicates whether Intercom is connected to the workspace
 */
export const IntegrationStatusSchema = z.object({
  connected: z.boolean(),
  providerWorkspaceId: z.string().nullable(),
  connectedAt: z.coerce.date().nullable(),
});

/**
 * Get integration status request (detailed mode)
 */
export const GetIntercomIntegrationSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * Get integration status response
 */
export const IntercomIntegrationStatusDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  integration: IntegrationStatusSchema,
});

/**
 * Intercom integration authorize request (detailed mode)
 */
export const IntercomIntegrationAuthorizeSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * Intercom integration authorize response
 * Returns the authorization URL and state for CSRF protection
 */
export const IntercomIntegrationAuthorizeDataSchema = z.object({
  authorizationUrl: z.string().url(),
  state: z.string(),
});

/**
 * Intercom integration callback request (detailed mode)
 * Received from Intercom after user authorizes
 */
export const IntercomIntegrationCallbackSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  query: z.object({
    code: z.string(),
    state: z.string(),
  }),
});

/**
 * Intercom integration callback response
 */
export const IntercomIntegrationCallbackDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  connected: z.literal(true),
  providerWorkspaceId: z.string(),
});

/**
 * Delete Intercom integration request (detailed mode)
 */
export const DeleteIntercomIntegrationSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * Delete Intercom integration response
 */
export const DeleteIntercomIntegrationDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  disconnected: z.literal(true),
});

/**
 * Get Intercom admins request (detailed mode)
 * Query param exclude_members filters out admins who are already workspace members
 */
export const GetIntercomAdminsSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  query: z.object({
    exclude_members: z.coerce.boolean().default(false),
  }),
});

/**
 * Intercom admin item
 */
export const IntercomAdminItemSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
});

/**
 * Get Intercom admins response
 * Includes invite policy to show allowed domains in the UI
 */
export const IntercomAdminsDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  admins: z.array(IntercomAdminItemSchema),
  invitePolicy: WorkspaceInvitePolicySchema,
  allowedDomains: z.array(z.string()).nullable(),
});

// Intercom suggestions pagination
export const INTERCOM_SUGGESTIONS = {
  DEFAULT_LIMIT: 5,
  MAX_LIMIT: 10,
} as const;

/**
 * Get Intercom suggestions request (detailed mode)
 */
export const GetIntercomSuggestionsSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(10).optional().default(5),
  }),
});

/**
 * Intercom suggestions response
 */
export const IntercomSuggestionsDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  connected: z.boolean(),
  suggestions: z.array(IntercomAdminItemSchema),
  hasMore: z.boolean(),
});

// ============================================================================
// ZENDESK INTEGRATION SCHEMAS
// ============================================================================

/**
 * Get Zendesk integration status request
 */
export const GetZendeskIntegrationSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * Get Zendesk integration status response
 */
export const ZendeskIntegrationStatusDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  integration: IntegrationStatusSchema,
});

/**
 * Delete Zendesk integration request
 */
export const DeleteZendeskIntegrationSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * Delete Zendesk integration response
 */
export const DeleteZendeskIntegrationDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  disconnected: z.literal(true),
});

// ============================================================================
// SLACK INTEGRATION SCHEMAS
// ============================================================================

/**
 * Get Slack integration status request
 */
export const GetSlackIntegrationSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * Get Slack integration status response
 */
export const SlackIntegrationStatusDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  integration: IntegrationStatusSchema,
});

/**
 * Slack integration authorize request
 */
export const SlackIntegrationAuthorizeSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * Slack integration authorize response
 * Returns the authorization URL and state for CSRF protection
 */
export const SlackIntegrationAuthorizeDataSchema = z.object({
  authorizationUrl: z.string().url(),
  state: z.string(),
});

/**
 * Slack integration callback request
 * Received from Slack after user authorizes
 */
export const SlackIntegrationCallbackSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  query: z.object({
    code: z.string(),
    state: z.string(),
  }),
});

/**
 * Slack integration callback response
 */
export const SlackIntegrationCallbackDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  connected: z.literal(true),
  providerWorkspaceId: z.string(),
});

/**
 * Delete Slack integration request
 */
export const DeleteSlackIntegrationSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * Delete Slack integration response
 */
export const DeleteSlackIntegrationDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  disconnected: z.literal(true),
});

// SLACK MEMBER FETCHING
// ============================================================================

/**
 * Get Slack members request
 * Query param exclude_members filters out users who are already workspace members
 */
export const GetSlackMembersSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  query: z.object({
    exclude_members: z.coerce.boolean().default(false),
  }),
});

/**
 * Slack member item — matches the Teammate interface consumed by the invite UI
 */
export const SlackMemberItemSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
});

/**
 * Get Slack members response
 * Includes invite policy so the UI can display allowed domains
 */
export const SlackMembersDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  members: z.array(SlackMemberItemSchema),
  invitePolicy: WorkspaceInvitePolicySchema,
  allowedDomains: z.array(z.string()).nullable(),
});

// Slack suggestions pagination
export const SLACK_SUGGESTIONS = {
  DEFAULT_LIMIT: 5,
  MAX_LIMIT: 10,
} as const;

/**
 * Get Slack suggestions request
 */
export const GetSlackSuggestionsSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(10).optional().default(5),
  }),
});

/**
 * Slack suggestions response
 */
export const SlackSuggestionsDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  connected: z.boolean(),
  suggestions: z.array(SlackMemberItemSchema),
  hasMore: z.boolean(),
});

// ============================================================================
// WORKSPACE LOGO UPLOAD
// ============================================================================

/**
 * Maximum logo file size: 2MB
 */
export const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;

/**
 * Upload workspace logo request
 */
export const UploadWorkspaceLogoSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * Upload workspace logo response
 * Returns the full CDN URL that is stored in the database
 */
export const WorkspaceLogoUploadDataSchema = z.object({
  url: z.string().url(),
});

// Additional type exports
export type WorkspaceLogoUploadData = z.infer<typeof WorkspaceLogoUploadDataSchema>;
export type WorkspaceItem = z.infer<typeof WorkspaceItemSchema>;
export type WorkspacesListData = z.infer<typeof WorkspacesListDataSchema>;
export type WorkspacePreferences = z.infer<typeof WorkspacePreferencesSchema>;
export type WorkspacePreferencesGetData = z.infer<typeof WorkspacePreferencesGetDataSchema>;
export type WorkspaceResourcesCountData = z.infer<typeof WorkspaceResourcesCountDataSchema>;
export type SuggestedWorkspaceItem = z.infer<typeof SuggestedWorkspaceItemSchema>;
export type SuggestWorkspacesData = z.infer<typeof SuggestWorkspacesDataSchema>;
export type WorkspaceStatusData = z.infer<typeof WorkspaceStatusDataSchema>;
export type InvitePolicyData = z.infer<typeof InvitePolicyDataSchema>;
export type InviteUrlData = z.infer<typeof InviteUrlDataSchema>;

// Domain type exports
export type DomainItem = z.infer<typeof DomainItemSchema>;
export type WorkspaceDomainsData = z.infer<typeof WorkspaceDomainsDataSchema>;
export type DomainAddData = z.infer<typeof DomainAddDataSchema>;
export type DomainUpdateData = z.infer<typeof DomainUpdateDataSchema>;

// Integration type exports
export type IntercomAdminItem = z.infer<typeof IntercomAdminItemSchema>;
export type IntercomAdminsData = z.infer<typeof IntercomAdminsDataSchema>;
export type IntercomSuggestionsData = z.infer<typeof IntercomSuggestionsDataSchema>;
export type SlackMemberItem = z.infer<typeof SlackMemberItemSchema>;
export type SlackMembersData = z.infer<typeof SlackMembersDataSchema>;
export type SlackSuggestionsData = z.infer<typeof SlackSuggestionsDataSchema>;
