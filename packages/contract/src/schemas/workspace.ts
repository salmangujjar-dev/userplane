import { z } from 'zod';
import { WorkspaceRoleSchema, DomainStatusSchema, PaginationMetaSchema } from './common';

/**
 * Workspace schemas
 */

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
  workspaceMemberId: z.string(),
  workspaceRole: WorkspaceRoleSchema,
});

/**
 * Workspace item
 */
export const WorkspaceItemSchema = z.object({
  workspaceId: z.string(),
  workspaceName: z.string(),
  workspaceRole: WorkspaceRoleSchema,
  recordingCustomizeLink: z.boolean(),
  notificationPreferences: WorkspaceNotificationPreferencesSchema.optional(),
  workspaceMembership: WorkspaceMembershipSchema.optional(),
});

/**
 * Workspaces list query parameters
 */
export const ListWorkspacesQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  include_notification_preference: z.boolean().optional().default(false),
  include_workspace_membership: z.boolean().optional().default(false),
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
 * Count workspaces query parameters
 */
export const CountWorkspacesQuerySchema = z.object({
  roles: z.array(WorkspaceRoleSchema).optional(),
});

/**
 * Workspace count response
 */
export const WorkspaceCountDataSchema = z.object({
  count: z.number().int().nonnegative(),
});

/**
 * Workspace by ID response
 */
export const WorkspaceByIdDataSchema = z.object({
  workspace: z.object({
    id: z.string(),
    workspaceName: z.string(),
    recordingCustomizeLink: z.boolean(),
    recordingCompanyName: z.string().nullable(),
    recordingCompanyLogoPath: z.string().nullable(),
    recordingHeader: z.string().nullable(),
    recordingFootnote: z.string().nullable(),
    recordingPrimaryColor: z.string().nullable(),
    recordingMaxDurationMs: z.number().int().nullable(),
    recordingSlug: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
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
 * Workspace preferences get response
 */
export const WorkspacePreferencesGetDataSchema = z.object({
  preferences: WorkspacePreferencesSchema,
});

/**
 * Update workspace preferences request
 */
export const UpdateWorkspacePreferencesSchema = z.object({
  recordingCustomizeLink: z.boolean().optional(),
});

/**
 * Workspace preferences update response
 */
export const WorkspacePreferencesUpdateDataSchema = z.object({
  workspaceId: z.string(),
});

/**
 * Team member
 */
export const TeamMemberSchema = z.object({
  workspaceMemberId: z.string(),
  memberName: z.string(),
  memberEmail: z.string().email(),
  workspaceRole: WorkspaceRoleSchema,
});

/**
 * Workspace team query parameters
 */
export const WorkspaceTeamQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  include_me: z.boolean().optional().default(false),
});

/**
 * Workspace team response
 */
export const WorkspaceTeamDataSchema = z.object({
  workspaceId: z.string(),
  workspaceMembers: z.array(TeamMemberSchema),
  workspaceMembership: WorkspaceMembershipSchema.optional(),
  pagination: PaginationMetaSchema,
});

/**
 * Update member role request
 */
export const UpdateMemberRoleSchema = z.object({
  role: WorkspaceRoleSchema,
});

/**
 * Member role update response
 */
export const MemberRoleUpdateDataSchema = z.object({
  workspaceId: z.string(),
  workspaceMemberId: z.string(),
  workspaceRole: WorkspaceRoleSchema,
});

/**
 * Member remove response
 */
export const MemberRemoveDataSchema = z.object({
  workspaceId: z.string(),
  workspaceMemberId: z.string(),
});

/**
 * Leave workspace response
 */
export const LeaveWorkspaceDataSchema = z.object({
  workspaceId: z.string(),
});

/**
 * Update notification preferences request
 */
export const UpdateNotificationPreferencesSchema = z.object({
  notifyOnLinkUsage: z.boolean().optional(),
  notifyOnQuotaReset: z.boolean().optional(),
  notifyOnQuotaLimit: z.boolean().optional(),
  notifyOnInviteAccepted: z.boolean().optional(),
  notifyOnMemberJoin: z.boolean().optional(),
});

/**
 * Notification preferences update response
 */
export const NotificationPreferencesUpdateDataSchema = z.object({
  workspaceId: z.string(),
});

/**
 * Domain item
 */
export const DomainItemSchema = z.object({
  domainId: z.string(),
  domainUrl: z.string(),
  domainStatus: DomainStatusSchema,
});

/**
 * Workspace domains query parameters
 */
export const WorkspaceDomainsQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
});

/**
 * Workspace domains response
 */
export const WorkspaceDomainsDataSchema = z.object({
  workspaceId: z.string(),
  domains: z.array(DomainItemSchema),
  pagination: PaginationMetaSchema,
});

/**
 * Domain by ID response
 */
export const DomainByIdDataSchema = z.object({
  workspaceId: z.string(),
  domain: z.object({
    domainId: z.string(),
    domainUrl: z.string(),
    domainStatus: DomainStatusSchema,
    recordingHideSensitive: z.boolean(),
    recordingCaptureClientLog: z.boolean(),
    recordingCaptureServerLog: z.boolean(),
    recordingCaptureNetworkLog: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

/**
 * Add domain request
 */
export const AddDomainSchema = z.object({
  url: z.string().url(),
});

/**
 * Domain add response
 */
export const DomainAddDataSchema = z.object({
  workspaceId: z.string(),
  domain: DomainItemSchema,
});

/**
 * Update domain request
 */
export const UpdateDomainSchema = z.object({
  url: z.string().url(),
});

/**
 * Domain update response
 */
export const DomainUpdateDataSchema = z.object({
  workspaceId: z.string(),
  domain: DomainItemSchema,
});

/**
 * Domain delete response
 */
export const DomainDeleteDataSchema = z.object({
  workspaceId: z.string(),
  domainId: z.string(),
});

/**
 * Domain verification URL response
 */
export const DomainVerificationUrlDataSchema = z.object({
  verificationUrl: z.string(),
  domainUrl: z.string(),
});

/**
 * Invite URL response
 */
export const InviteUrlDataSchema = z.object({
  inviteUrl: z.string(),
  workspaceId: z.string(),
});

/**
 * Update link settings request
 */
export const UpdateLinkSettingsSchema = z.object({
  recordingCompanyName: z.string().nullable().optional(),
  recordingHeader: z.string().nullable().optional(),
  recordingFootnote: z.string().nullable().optional(),
  recordingPrimaryColor: z.string().nullable().optional(),
  recordingMaxDurationMs: z.number().int().positive().nullable().optional(),
});

/**
 * Link settings response
 */
export const LinkSettingsDataSchema = z.object({
  workspaceId: z.string(),
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
 * Update workspace name request
 */
export const UpdateWorkspaceNameSchema = z.object({
  name: z.string().min(1).max(255),
});

/**
 * Workspace name update response
 */
export const WorkspaceNameUpdateDataSchema = z.object({
  workspaceId: z.string(),
  workspaceName: z.string(),
});

/**
 * Workspace delete response
 */
export const WorkspaceDeleteDataSchema = z.object({
  workspaceId: z.string(),
});

/**
 * Workspace search query parameters
 */
export const WorkspaceSearchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  type: z.enum(['members', 'projects', 'domains', 'links']),
  limit: z.number().int().min(1).max(20).optional().default(5),
});

/**
 * Workspace search response
 */
export const WorkspaceSearchDataSchema = z.object({
  results: z.array(z.unknown()),
});
