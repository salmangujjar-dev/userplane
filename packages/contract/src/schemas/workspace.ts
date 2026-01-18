import { PLAN_IDS, PLAN_NAME_VALUES } from '@workspace/pricing';
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
  SearchQuerySchema,
  SortDirectionSchema,
  TokenSchema,
  UserIdSchema,
  WorkspaceIdSchema,
  WorkspaceInvitePolicySchema,
  WorkspaceMemberIdSchema,
  WorkspaceRoleSchema,
} from './common';
import { FormEmailSchema } from './form';

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
  notifyOnLinkUsage: z.boolean(),
  notifyOnQuotaReset: z.boolean(),
  notifyOnQuotaLimit: z.boolean(),
  notifyOnInviteAccepted: z.boolean(),
  notifyOnMemberJoin: z.boolean(),
});

/**
 * Workspace membership
 */
export const WorkspaceMembershipSchema = z.object({
  workspaceMemberId: WorkspaceMemberIdSchema,
  workspaceRole: WorkspaceRoleSchema,
});

/**
 * Minimal workspace item (just ID and name)
 */
export const WorkspaceMinimalItemSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  workspaceName: z.string(),
});

/**
 * Workspace item
 */
export const WorkspaceItemSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  workspaceName: z.string(),
  workspacePlan: z.enum(PLAN_IDS),
  createdAt: z.date(),
  updatedAt: z.date(),
  notificationPreferences: WorkspaceNotificationPreferencesSchema.optional(),
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
    minimal: z.coerce.boolean().optional().default(false),
    include_notification_preference: z.coerce.boolean().optional().default(false),
    include_workspace_membership: z.coerce.boolean().optional().default(false),
  }),
});

/**
 * Workspaces list response
 */
export const WorkspacesListDataSchema = z.object({
  workspaces: z.array(z.union([WorkspaceItemSchema, WorkspaceMinimalItemSchema])),
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
    workspacePlan: z.enum(PLAN_IDS),
    workspacePlanName: z.enum(PLAN_NAME_VALUES),
    createdAt: z.date(),
    updatedAt: z.date(),
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
 * Team member
 */
export const TeamMemberSchema = z.object({
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
  workspaceMembers: z.array(TeamMemberSchema),
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
    notifyOnLinkUsage: z.boolean().optional(),
    notifyOnQuotaReset: z.boolean().optional(),
    notifyOnQuotaLimit: z.boolean().optional(),
    notifyOnInviteAccepted: z.boolean().optional(),
    notifyOnMemberJoin: z.boolean().optional(),
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
  createdAt: z.date(),
  updatedAt: z.date(),
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
    createdAt: z.date(),
    updatedAt: z.date(),
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
  workspace: z.object({
    workspaceId: WorkspaceIdSchema,
    workspaceName: z.string(),
    isDeleted: z.boolean(),
    deletedAt: z.date().nullable(),
  }),
  restoredProjects: z.number().int().nonnegative(),
  restoredLinks: z.number().int().nonnegative(),
});

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
 * Get workspace billing email request (detailed mode)
 */
export const GetWorkspaceBillingEmailSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * Get workspace billing email response
 */
export const WorkspaceBillingEmailDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  workspaceBillingEmail: z.string().email(),
});

/**
 * Update workspace billing email request (detailed mode)
 */
export const UpdateWorkspaceBillingEmailSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  body: z.object({
    email: FormEmailSchema,
  }),
});

/**
 * Update workspace billing email response
 */
export const WorkspaceBillingEmailUpdateDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  workspaceBillingEmail: z.string().email(),
});

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
