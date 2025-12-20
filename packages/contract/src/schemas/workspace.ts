import { z } from 'zod';
import { WorkspaceRoleSchema, DomainStatusSchema, PaginationMetaSchema } from './common';
import { PLAN_IDS, PLAN_NAME_VALUES } from '@workspace/pricing';
import { SendWorkspaceInvitesSchema } from './invite';

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
  workspacePlan: z.enum([
    'starter_monthly',
    'starter_annual',
    'scale_up_monthly',
    'scale_up_annual',
    'enterprise_monthly',
    'enterprise_annual',
    'early_bird_monthly',
    'tiny_bird_monthly',
  ]),
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
    include_notification_preference: z.coerce.boolean().optional().default(false),
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
    workspaceId: z.string(),
  }),
});

/**
 * Workspace by ID response
 */
export const WorkspaceByIdDataSchema = z.object({
  workspace: z.object({
    workspaceId: z.string(),
    workspaceName: z.string(),
    workspacePlan: z.enum(PLAN_IDS),
    workspacePlanName: z.enum(PLAN_NAME_VALUES),
    createdAt: z.date(),
    updatedAt: z.date(),
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
    workspaceId: z.string(),
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
    workspaceId: z.string(),
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
    workspaceId: z.string(),
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
  workspaceMemberId: z.string(),
  memberName: z.string(),
  memberEmail: z.string().email(),
  workspaceRole: WorkspaceRoleSchema,
});

/**
 * Workspace team query parameters (detailed mode)
 */
export const WorkspaceTeamQuerySchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    include_me: z.coerce.boolean().optional().default(false),
  }),
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
 * Update member role request (detailed mode)
 */
export const UpdateMemberRoleSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
    workspaceMemberId: z.string(),
  }),
  body: z.object({
    role: WorkspaceRoleSchema,
  }),
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
 * Member remove request (detailed mode)
 */
export const RemoveMemberSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
    workspaceMemberId: z.string(),
  }),
});

/**
 * Member remove response
 */
export const MemberRemoveDataSchema = z.object({
  workspaceId: z.string(),
  workspaceMemberId: z.string(),
});

/**
 * Leave workspace request (detailed mode)
 */
export const LeaveWorkspaceSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
});

/**
 * Leave workspace response
 */
export const LeaveWorkspaceDataSchema = z.object({
  workspaceId: z.string(),
});

/**
 * Update notification preferences request (detailed mode)
 */
export const UpdateNotificationPreferencesSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
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
  workspaceId: z.string(),
});

/**
 * Domain item
 */
export const DomainItemSchema = z.object({
  domainId: z.string(),
  domainUrl: z.string(),
  domainStatus: DomainStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Workspace domains query parameters (detailed mode)
 */
export const WorkspaceDomainsQuerySchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
  }),
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
 * Domain by ID request (detailed mode)
 */
export const DomainByIdSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
    domainId: z.string(),
  }),
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
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
});

/**
 * Add domain request (detailed mode)
 */
export const AddDomainSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
  body: z.object({
    url: z.string().url(),
  }),
});

/**
 * Domain add response
 */
export const DomainAddDataSchema = z.object({
  workspaceId: z.string(),
  domain: DomainItemSchema,
});

/**
 * Update domain request (detailed mode)
 */
export const UpdateDomainSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
    domainId: z.string(),
  }),
  body: z.object({
    url: z.string().url(),
  }),
});

/**
 * Domain update response
 */
export const DomainUpdateDataSchema = z.object({
  workspaceId: z.string(),
  domain: DomainItemSchema,
});

/**
 * Domain delete request (detailed mode)
 */
export const DeleteDomainSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
    domainId: z.string(),
  }),
});

/**
 * Domain delete response
 */
export const DomainDeleteDataSchema = z.object({
  workspaceId: z.string(),
  domainId: z.string(),
});

/**
 * Domain verification URL request (detailed mode)
 */
export const DomainVerificationUrlSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
    domainId: z.string(),
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
    workspaceId: z.string(),
  }),
});

/**
 * Invite URL response
 */
export const InviteUrlDataSchema = z.object({
  inviteUrl: z.string(),
  workspaceId: z.string(),
});

/**
 * Update link settings request (detailed mode)
 */
export const UpdateLinkSettingsSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
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
 * Update workspace name request (detailed mode)
 */
export const UpdateWorkspaceNameSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
  body: z.object({
    name: z.string().min(1).max(255),
  }),
});

/**
 * Workspace name update response
 */
export const WorkspaceNameUpdateDataSchema = z.object({
  workspaceId: z.string(),
  workspaceName: z.string(),
});

/**
 * Workspace delete request (detailed mode)
 */
export const DeleteWorkspaceSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
});

/**
 * Workspace delete response
 */
export const WorkspaceDeleteDataSchema = z.object({
  workspaceId: z.string(),
  success: z.boolean(),
});

/**
 * Workspace search query parameters (detailed mode)
 */
export const WorkspaceSearchQuerySchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
  query: z.object({
    q: z.string().min(1).max(100),
    type: z.enum(['members', 'projects', 'domains', 'links']),
    limit: z.coerce.number().int().min(1).max(20).optional().default(5),
  }),
});

/**
 * Workspace search response
 */
export const WorkspaceSearchDataSchema = z.object({
  results: z.array(z.unknown()),
});
