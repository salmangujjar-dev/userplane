import { oc } from '@orpc/contract';
import {
  ListWorkspacesQuerySchema,
  WorkspacesListDataSchema,
  CountWorkspacesQuerySchema,
  WorkspaceCountDataSchema,
  WorkspaceByIdSchema,
  WorkspaceByIdDataSchema,
  WorkspaceResourcesCountQuerySchema,
  WorkspaceResourcesCountDataSchema,
  WorkspacePreferencesGetSchema,
  WorkspacePreferencesGetDataSchema,
  UpdateWorkspacePreferencesSchema,
  WorkspacePreferencesUpdateDataSchema,
  WorkspaceTeamQuerySchema,
  WorkspaceTeamDataSchema,
  GetWorkspaceMembershipSchema,
  WorkspaceMembershipDataSchema,
  UpdateMemberRoleSchema,
  MemberRoleUpdateDataSchema,
  RemoveMemberSchema,
  MemberRemoveDataSchema,
  LeaveWorkspaceSchema,
  LeaveWorkspaceDataSchema,
  GetNotificationPreferencesSchema,
  NotificationPreferencesGetDataSchema,
  UpdateNotificationPreferencesSchema,
  NotificationPreferencesUpdateDataSchema,
  WorkspaceDomainsQuerySchema,
  WorkspaceDomainsDataSchema,
  DomainByIdSchema,
  DomainByIdDataSchema,
  AddDomainSchema,
  DomainAddDataSchema,
  UpdateDomainSchema,
  DomainUpdateDataSchema,
  DeleteDomainSchema,
  DomainDeleteDataSchema,
  DomainVerificationUrlSchema,
  DomainVerificationUrlDataSchema,
  GetDomainRecordingPreferencesSchema,
  DomainRecordingPreferencesDataSchema,
  UpdateDomainRecordingPreferencesSchema,
  DomainRecordingPreferencesUpdateDataSchema,
  ReplaceDomainRecordingPreferencesSchema,
  SendDomainInstructionsSchema,
  SendDomainInstructionsResultSchema,
  InviteUrlSchema,
  InviteUrlDataSchema,
  SendWorkspaceInvitesSchema,
  SendInvitesResultSchema,
  AcceptInviteSchema,
  AcceptInviteDataSchema,
  UpdateLinkSettingsSchema,
  LinkSettingsDataSchema,
  UpdateWorkspaceNameSchema,
  WorkspaceNameUpdateDataSchema,
  DeleteWorkspaceSchema,
  WorkspaceDeleteDataSchema,
  RestoreWorkspaceSchema,
  WorkspaceRestoreDataSchema,
  WorkspaceSearchQuerySchema,
  WorkspaceSearchDataSchema,
  GetInvitePolicySchema,
  InvitePolicyDataSchema,
  UpdateInvitePolicySchema,
  InvitePolicyUpdateDataSchema,
  SuggestWorkspacesQuerySchema,
  SuggestWorkspacesDataSchema,
  JoinWorkspaceSchema,
  JoinWorkspaceDataSchema,
  ValidateAccessRequestSchema,
  ValidateAccessRequestDataSchema,
  ApproveAccessRequestSchema,
  ApproveAccessRequestDataSchema,
  DeclineAccessRequestSchema,
  DeclineAccessRequestDataSchema,
  GetWorkspaceStatusSchema,
  WorkspaceStatusDataSchema,
  GetWorkspaceBillingEmailSchema,
  WorkspaceBillingEmailDataSchema,
  UpdateWorkspaceBillingEmailSchema,
  WorkspaceBillingEmailUpdateDataSchema,
  ApiResponseSchema,
  WorkspaceErrors,
  InviteErrors,
  DomainErrors,
} from '../schemas';

/**
 * Workspace contract
 * Endpoints for workspace management, members, domains, and settings
 * All endpoints require cookie-based authentication (userplane.session_token)
 */

/**
 * GET /workspace
 * List all user workspaces
 */
export const getAllWorkspaces = oc
  .route({
    method: 'GET',
    path: '/workspace',
    inputStructure: 'detailed',
    summary: 'List workspaces',
    description: 'Retrieve paginated list of workspaces for the current user',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    WORKSPACE_USER_ID_REQUIRED: WorkspaceErrors.WORKSPACE_USER_ID_REQUIRED,
  })
  .input(ListWorkspacesQuerySchema)
  .output(ApiResponseSchema(WorkspacesListDataSchema));

/**
 * GET /workspace/count
 * Count user workspaces by role
 */
export const countWorkspaces = oc
  .route({
    method: 'GET',
    path: '/workspace/count',
    inputStructure: 'detailed',
    summary: 'Count workspaces',
    description: 'Count workspaces by role for the current user',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    WORKSPACE_USER_ID_REQUIRED: WorkspaceErrors.WORKSPACE_USER_ID_REQUIRED,
  })
  .input(CountWorkspacesQuerySchema)
  .output(ApiResponseSchema(WorkspaceCountDataSchema));

/**
 * GET /workspace/{workspaceId}
 * Get workspace by ID
 */
export const getWorkspaceById = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}',
    inputStructure: 'detailed',
    summary: 'Get workspace by ID',
    description: 'Retrieve complete workspace details',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
  })
  .input(WorkspaceByIdSchema)
  .output(ApiResponseSchema(WorkspaceByIdDataSchema));

/**
 * GET /workspace/{workspaceId}/count
 * Count workspace resources
 */
export const getWorkspaceResourcesCount = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}/count',
    inputStructure: 'detailed',
    summary: 'Count workspace resources',
    description:
      'Get counts of various resources in a workspace (projects, recordings, links, domains, members)',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
  })
  .input(WorkspaceResourcesCountQuerySchema)
  .output(ApiResponseSchema(WorkspaceResourcesCountDataSchema));

/**
 * GET /workspace/{workspaceId}/preferences
 * Get workspace preferences
 */
export const getWorkspacePreferences = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}/preferences',
    inputStructure: 'detailed',
    summary: 'Get workspace preferences',
    description: 'Retrieve workspace recording and customization preferences',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
  })
  .input(WorkspacePreferencesGetSchema)
  .output(ApiResponseSchema(WorkspacePreferencesGetDataSchema));

/**
 * PATCH /workspace/{workspaceId}/preferences
 * Update workspace preferences
 */
export const updateWorkspacePreferences = oc
  .route({
    method: 'PATCH',
    path: '/workspace/{workspaceId}/preferences',
    inputStructure: 'detailed',
    summary: 'Update workspace preferences',
    description: 'Partially update workspace preferences',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
  })
  .input(UpdateWorkspacePreferencesSchema)
  .output(ApiResponseSchema(WorkspacePreferencesUpdateDataSchema));

/**
 * GET /workspace/{workspaceId}/members
 * Get workspace members
 */
export const getWorkspaceMembers = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}/members',
    inputStructure: 'detailed',
    summary: 'Get workspace members',
    description: 'Retrieve paginated list of workspace team members',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
    WORKSPACE_USER_ID_REQUIRED: WorkspaceErrors.WORKSPACE_USER_ID_REQUIRED,
  })
  .input(WorkspaceTeamQuerySchema)
  .output(ApiResponseSchema(WorkspaceTeamDataSchema));

/**
 * GET /workspace/{workspaceId}/membership
 * Get current user's workspace membership
 */
export const getWorkspaceMembership = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}/membership',
    inputStructure: 'detailed',
    summary: 'Get workspace membership',
    description: 'Retrieve current user membership and role in the workspace',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
    WORKSPACE_MEMBER_IDS_REQUIRED: WorkspaceErrors.WORKSPACE_MEMBER_IDS_REQUIRED,
    WORKSPACE_MEMBER_NOT_IN_WORKSPACE: WorkspaceErrors.WORKSPACE_MEMBER_NOT_IN_WORKSPACE,
  })
  .input(GetWorkspaceMembershipSchema)
  .output(ApiResponseSchema(WorkspaceMembershipDataSchema));

/**
 * PATCH /workspace/{workspaceId}/members/{workspaceMemberId}
 * Update member role
 */
export const updateMemberRole = oc
  .route({
    method: 'PATCH',
    path: '/workspace/{workspaceId}/members/{workspaceMemberId}',
    inputStructure: 'detailed',
    summary: 'Update member role',
    description: 'Update workspace member role',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
    WORKSPACE_MEMBER_ID_REQUIRED: WorkspaceErrors.WORKSPACE_MEMBER_ID_REQUIRED,
    WORKSPACE_MEMBER_NOT_FOUND: WorkspaceErrors.WORKSPACE_MEMBER_NOT_FOUND,
    WORKSPACE_MEMBER_CANNOT_CHANGE_OWN_ROLE:
      WorkspaceErrors.WORKSPACE_MEMBER_CANNOT_CHANGE_OWN_ROLE,
    WORKSPACE_MEMBER_LAST_OWNER_ROLE_CHANGE:
      WorkspaceErrors.WORKSPACE_MEMBER_LAST_OWNER_ROLE_CHANGE,
  })
  .input(UpdateMemberRoleSchema)
  .output(ApiResponseSchema(MemberRoleUpdateDataSchema));

/**
 * DELETE /workspace/{workspaceId}/members/{workspaceMemberId}
 * Remove workspace member
 */
export const removeMember = oc
  .route({
    method: 'DELETE',
    path: '/workspace/{workspaceId}/members/{workspaceMemberId}',
    inputStructure: 'detailed',
    summary: 'Remove member',
    description: 'Remove a member from the workspace',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
    WORKSPACE_MEMBER_ID_REQUIRED: WorkspaceErrors.WORKSPACE_MEMBER_ID_REQUIRED,
    WORKSPACE_MEMBER_NOT_FOUND: WorkspaceErrors.WORKSPACE_MEMBER_NOT_FOUND,
    WORKSPACE_MEMBER_WRONG_WORKSPACE: WorkspaceErrors.WORKSPACE_MEMBER_WRONG_WORKSPACE,
    WORKSPACE_MEMBER_CANNOT_REMOVE_SELF: WorkspaceErrors.WORKSPACE_MEMBER_CANNOT_REMOVE_SELF,
    WORKSPACE_MEMBER_LAST_OWNER_REMOVE: WorkspaceErrors.WORKSPACE_MEMBER_LAST_OWNER_REMOVE,
  })
  .input(RemoveMemberSchema)
  .output(ApiResponseSchema(MemberRemoveDataSchema));

/**
 * POST /workspace/{workspaceId}/leave
 * Leave workspace
 */
export const leaveWorkspace = oc
  .route({
    method: 'POST',
    path: '/workspace/{workspaceId}/leave',
    inputStructure: 'detailed',
    summary: 'Leave workspace',
    description: 'Leave a workspace as a member',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
    WORKSPACE_MEMBER_IDS_REQUIRED: WorkspaceErrors.WORKSPACE_MEMBER_IDS_REQUIRED,
    WORKSPACE_MEMBER_NOT_IN_WORKSPACE: WorkspaceErrors.WORKSPACE_MEMBER_NOT_IN_WORKSPACE,
    WORKSPACE_MEMBER_SOLE_OWNER_WITH_MEMBERS:
      WorkspaceErrors.WORKSPACE_MEMBER_SOLE_OWNER_WITH_MEMBERS,
    WORKSPACE_DELETE_FAILED: WorkspaceErrors.WORKSPACE_DELETE_FAILED,
  })
  .input(LeaveWorkspaceSchema)
  .output(ApiResponseSchema(LeaveWorkspaceDataSchema));

/**
 * GET /workspace/{workspaceId}/notifications
 * Get notification preferences
 */
export const getNotificationPreferences = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}/notifications',
    inputStructure: 'detailed',
    summary: 'Get notification preferences',
    description: 'Retrieve workspace notification preferences for current user',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
    WORKSPACE_MEMBER_IDS_REQUIRED: WorkspaceErrors.WORKSPACE_MEMBER_IDS_REQUIRED,
    WORKSPACE_MEMBER_NOT_IN_WORKSPACE: WorkspaceErrors.WORKSPACE_MEMBER_NOT_IN_WORKSPACE,
  })
  .input(GetNotificationPreferencesSchema)
  .output(ApiResponseSchema(NotificationPreferencesGetDataSchema));

/**
 * PATCH /workspace/{workspaceId}/notifications
 * Update notification preferences
 */
export const updateNotificationPreferences = oc
  .route({
    method: 'PATCH',
    path: '/workspace/{workspaceId}/notifications',
    inputStructure: 'detailed',
    summary: 'Update notification preferences',
    description: 'Update workspace notification preferences for current user',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
    WORKSPACE_MEMBER_IDS_REQUIRED: WorkspaceErrors.WORKSPACE_MEMBER_IDS_REQUIRED,
    WORKSPACE_MEMBER_NOT_IN_WORKSPACE: WorkspaceErrors.WORKSPACE_MEMBER_NOT_IN_WORKSPACE,
  })
  .input(UpdateNotificationPreferencesSchema)
  .output(ApiResponseSchema(NotificationPreferencesUpdateDataSchema));

/**
 * GET /workspace/{workspaceId}/invite
 * Get workspace invite URL
 */
export const getInviteUrl = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}/invite',
    inputStructure: 'detailed',
    summary: 'Get invite URL',
    description: 'Retrieve workspace invite URL',
    tags: ['Workspaces'],
  })
  .errors({
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
  })
  .input(InviteUrlSchema)
  .output(ApiResponseSchema(InviteUrlDataSchema));

/**
 * GET /workspace/{workspaceId}/billing-email
 * Get workspace billing email
 * Available to all authenticated users (who can access the workspace, usually members)
 */
export const getWorkspaceBillingEmail = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}/billing-email',
    inputStructure: 'detailed',
    summary: 'Get workspace billing email',
    description: 'Retrieve workspace billing email',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
  })
  .input(GetWorkspaceBillingEmailSchema)
  .output(ApiResponseSchema(WorkspaceBillingEmailDataSchema));

/**
 * PATCH /workspace/{workspaceId}/billing-email
 * Update workspace billing email
 * Available only to workspace admin and owners
 */
export const updateWorkspaceBillingEmail = oc
  .route({
    method: 'PATCH',
    path: '/workspace/{workspaceId}/billing-email',
    inputStructure: 'detailed',
    summary: 'Update workspace billing email',
    description: 'Update workspace billing email address',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
  })
  .input(UpdateWorkspaceBillingEmailSchema)
  .output(ApiResponseSchema(WorkspaceBillingEmailUpdateDataSchema));

/**
 * POST /workspace/{workspaceId}/invite/rotate
 * Rotate invite token
 */
export const rotateInviteToken = oc
  .route({
    method: 'POST',
    path: '/workspace/{workspaceId}/invite/rotate',
    inputStructure: 'detailed',
    summary: 'Rotate invite token',
    description: 'Generate new workspace invite URL',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
  })
  .input(InviteUrlSchema)
  .output(ApiResponseSchema(InviteUrlDataSchema));

/**
 * POST /workspace/{workspaceId}/invite/send
 * Send workspace invitations
 */
export const sendWorkspaceInvites = oc
  .route({
    method: 'POST',
    path: '/workspace/{workspaceId}/invite/send',
    inputStructure: 'detailed',
    summary: 'Send workspace invitations',
    description: 'Send workspace invitations to multiple email addresses',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
  })
  .input(SendWorkspaceInvitesSchema)
  .output(ApiResponseSchema(SendInvitesResultSchema));

/**
 * POST /workspace/{workspaceId}/invite/accept
 * Accept workspace invitation
 */
export const acceptInvite = oc
  .route({
    method: 'POST',
    path: '/workspace/{workspaceId}/invite/accept',
    inputStructure: 'detailed',
    summary: 'Accept workspace invitation',
    description: 'Accept a workspace invitation if the token matches',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    INVITE_TOKEN_INVALID: InviteErrors.INVITE_TOKEN_INVALID,
    INVITE_TOKEN_INVALIDATED: InviteErrors.INVITE_TOKEN_INVALIDATED,
  })
  .input(AcceptInviteSchema)
  .output(ApiResponseSchema(AcceptInviteDataSchema));

/**
 * GET /workspace/{workspaceId}/domains
 * Get workspace domains
 */
export const getWorkspaceDomains = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}/domains',
    inputStructure: 'detailed',
    summary: 'Get workspace domains',
    description: 'Retrieve paginated list of workspace domains',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
  })
  .input(WorkspaceDomainsQuerySchema)
  .output(ApiResponseSchema(WorkspaceDomainsDataSchema));

/**
 * GET /workspace/{workspaceId}/domains/{domainId}
 * Get domain by ID
 */
export const getDomainById = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}/domains/{domainId}',
    inputStructure: 'detailed',
    summary: 'Get domain by ID',
    description: 'Retrieve complete domain details including recording preferences',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    DOMAIN_NOT_FOUND: DomainErrors.DOMAIN_NOT_FOUND,
    DOMAIN_GONE: DomainErrors.DOMAIN_GONE,
    DOMAIN_WORKSPACE_MISMATCH: DomainErrors.DOMAIN_WORKSPACE_MISMATCH,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
  })
  .input(DomainByIdSchema)
  .output(ApiResponseSchema(DomainByIdDataSchema));

/**
 * POST /workspace/{workspaceId}/domains
 * Add domain to workspace
 */
export const addDomain = oc
  .route({
    method: 'POST',
    path: '/workspace/{workspaceId}/domains',
    inputStructure: 'detailed',
    summary: 'Add domain',
    description: 'Add a new domain to the workspace',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    DOMAIN_URL_REQUIRED: DomainErrors.DOMAIN_URL_REQUIRED,
    DOMAIN_ALREADY_EXISTS: DomainErrors.DOMAIN_ALREADY_EXISTS,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
  })
  .input(AddDomainSchema)
  .output(ApiResponseSchema(DomainAddDataSchema));

/**
 * PATCH /workspace/{workspaceId}/domains/{domainId}
 * Update domain
 */
export const updateDomain = oc
  .route({
    method: 'PATCH',
    path: '/workspace/{workspaceId}/domains/{domainId}',
    inputStructure: 'detailed',
    summary: 'Update domain',
    description: 'Update domain URL',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    DOMAIN_URL_REQUIRED: DomainErrors.DOMAIN_URL_REQUIRED,
    DOMAIN_NOT_FOUND: DomainErrors.DOMAIN_NOT_FOUND,
    DOMAIN_GONE: DomainErrors.DOMAIN_GONE,
    DOMAIN_WORKSPACE_MISMATCH: DomainErrors.DOMAIN_WORKSPACE_MISMATCH,
    DOMAIN_ALREADY_EXISTS: DomainErrors.DOMAIN_ALREADY_EXISTS,
    DOMAIN_UPDATE_FAILED: DomainErrors.DOMAIN_UPDATE_FAILED,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
  })
  .input(UpdateDomainSchema)
  .output(ApiResponseSchema(DomainUpdateDataSchema));

/**
 * DELETE /workspace/{workspaceId}/domains/{domainId}
 * Delete domain
 */
export const deleteDomain = oc
  .route({
    method: 'DELETE',
    path: '/workspace/{workspaceId}/domains/{domainId}',
    inputStructure: 'detailed',
    summary: 'Delete domain',
    description: 'Remove a domain from the workspace',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    DOMAIN_NOT_FOUND: DomainErrors.DOMAIN_NOT_FOUND,
    DOMAIN_GONE: DomainErrors.DOMAIN_GONE,
    DOMAIN_WORKSPACE_MISMATCH: DomainErrors.DOMAIN_WORKSPACE_MISMATCH,
    DOMAIN_LAST_DOMAIN_DELETE_FORBIDDEN: DomainErrors.DOMAIN_LAST_DOMAIN_DELETE_FORBIDDEN,
    DOMAIN_DELETE_FAILED: DomainErrors.DOMAIN_DELETE_FAILED,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
  })
  .input(DeleteDomainSchema)
  .output(ApiResponseSchema(DomainDeleteDataSchema));

/**
 * GET /workspace/{workspaceId}/domains/{domainId}/verify
 * Get domain verification URL
 */
export const getDomainVerificationUrl = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}/domains/{domainId}/verify',
    inputStructure: 'detailed',
    summary: 'Get domain verification URL',
    description: 'Generate domain verification URL',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    DOMAIN_NOT_FOUND: DomainErrors.DOMAIN_NOT_FOUND,
    DOMAIN_GONE: DomainErrors.DOMAIN_GONE,
    DOMAIN_WORKSPACE_MISMATCH: DomainErrors.DOMAIN_WORKSPACE_MISMATCH,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
  })
  .input(DomainVerificationUrlSchema)
  .output(ApiResponseSchema(DomainVerificationUrlDataSchema));

/**
 * GET /workspace/{workspaceId}/domains/{domainId}/preferences
 * Get domain recording preferences
 */
export const getDomainRecordingPreferences = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}/domains/{domainId}/preferences',
    inputStructure: 'detailed',
    summary: 'Get domain recording preferences',
    description: 'Retrieve recording preferences for a specific domain',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    DOMAIN_NOT_FOUND: DomainErrors.DOMAIN_NOT_FOUND,
    DOMAIN_GONE: DomainErrors.DOMAIN_GONE,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
  })
  .input(GetDomainRecordingPreferencesSchema)
  .output(ApiResponseSchema(DomainRecordingPreferencesDataSchema));

/**
 * PATCH /workspace/{workspaceId}/domains/{domainId}/preferences
 * Update domain recording preferences (partial update)
 */
export const updateDomainRecordingPreferences = oc
  .route({
    method: 'PATCH',
    path: '/workspace/{workspaceId}/domains/{domainId}/preferences',
    inputStructure: 'detailed',
    summary: 'Update domain recording preferences',
    description: 'Partially update recording preferences for a specific domain',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    DOMAIN_NOT_FOUND: DomainErrors.DOMAIN_NOT_FOUND,
    DOMAIN_GONE: DomainErrors.DOMAIN_GONE,
    DOMAIN_WORKSPACE_MISMATCH: DomainErrors.DOMAIN_WORKSPACE_MISMATCH,
    DOMAIN_UNVERIFIED: DomainErrors.DOMAIN_UNVERIFIED,
    DOMAIN_PREFERENCES_UPDATE_FAILED: DomainErrors.DOMAIN_PREFERENCES_UPDATE_FAILED,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
  })
  .input(UpdateDomainRecordingPreferencesSchema)
  .output(ApiResponseSchema(DomainRecordingPreferencesUpdateDataSchema));

/**
 * PUT /workspace/{workspaceId}/domains/{domainId}/preferences
 * Replace domain recording preferences (full replacement)
 */
export const replaceDomainRecordingPreferences = oc
  .route({
    method: 'PUT',
    path: '/workspace/{workspaceId}/domains/{domainId}/preferences',
    inputStructure: 'detailed',
    summary: 'Replace domain recording preferences',
    description: 'Replace all recording preferences for a specific domain',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    DOMAIN_NOT_FOUND: DomainErrors.DOMAIN_NOT_FOUND,
    DOMAIN_GONE: DomainErrors.DOMAIN_GONE,
    DOMAIN_WORKSPACE_MISMATCH: DomainErrors.DOMAIN_WORKSPACE_MISMATCH,
    DOMAIN_UNVERIFIED: DomainErrors.DOMAIN_UNVERIFIED,
    DOMAIN_PREFERENCES_UPDATE_FAILED: DomainErrors.DOMAIN_PREFERENCES_UPDATE_FAILED,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
  })
  .input(ReplaceDomainRecordingPreferencesSchema)
  .output(ApiResponseSchema(DomainRecordingPreferencesUpdateDataSchema));

/**
 * POST /workspace/{workspaceId}/domains/{domainId}/instructions
 * Send domain developer instructions to email addresses
 */
export const sendDomainInstructions = oc
  .route({
    method: 'POST',
    path: '/workspace/{workspaceId}/domains/{domainId}/instructions',
    inputStructure: 'detailed',
    summary: 'Send domain developer instructions',
    description: 'Send setup instructions for domain configuration to developer email addresses',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    DOMAIN_NOT_FOUND: DomainErrors.DOMAIN_NOT_FOUND,
    DOMAIN_GONE: DomainErrors.DOMAIN_GONE,
    DOMAIN_WORKSPACE_MISMATCH: DomainErrors.DOMAIN_WORKSPACE_MISMATCH,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
  })
  .input(SendDomainInstructionsSchema)
  .output(ApiResponseSchema(SendDomainInstructionsResultSchema));

/**
 * PUT /workspace/{workspaceId}/preferences/link
 * Update link branding settings
 */
export const updateLinkSettings = oc
  .route({
    method: 'PUT',
    path: '/workspace/{workspaceId}/preferences/link',
    inputStructure: 'detailed',
    summary: 'Update link settings',
    description: 'Update recording link branding and customization settings',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
  })
  .input(UpdateLinkSettingsSchema)
  .output(ApiResponseSchema(LinkSettingsDataSchema));

/**
 * PATCH /workspace/{workspaceId}
 * Update workspace name
 */
export const updateWorkspaceName = oc
  .route({
    method: 'PATCH',
    path: '/workspace/{workspaceId}',
    inputStructure: 'detailed',
    summary: 'Update workspace name',
    description: 'Update workspace name',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
    WORKSPACE_NAME_REQUIRED: WorkspaceErrors.WORKSPACE_NAME_REQUIRED,
    WORKSPACE_NAME_TOO_LONG: WorkspaceErrors.WORKSPACE_NAME_TOO_LONG,
  })
  .input(UpdateWorkspaceNameSchema)
  .output(ApiResponseSchema(WorkspaceNameUpdateDataSchema));

/**
 * DELETE /workspace/{workspaceId}
 * Delete workspace
 */
export const deleteWorkspace = oc
  .route({
    method: 'DELETE',
    path: '/workspace/{workspaceId}',
    inputStructure: 'detailed',
    summary: 'Delete workspace',
    description: 'Permanently delete a workspace',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
    WORKSPACE_DELETE_FAILED: WorkspaceErrors.WORKSPACE_DELETE_FAILED,
  })
  .input(DeleteWorkspaceSchema)
  .output(ApiResponseSchema(WorkspaceDeleteDataSchema));

/**
 * POST /workspace/{workspaceId}/restore
 * Restore a soft-deleted workspace
 */
export const restoreWorkspace = oc
  .route({
    method: 'POST',
    path: '/workspace/{workspaceId}/restore',
    inputStructure: 'detailed',
    summary: 'Restore workspace',
    description:
      'Restore a soft-deleted workspace and its associated projects and links within the grace period',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_RESTORE_TIME_EXPIRED: WorkspaceErrors.WORKSPACE_RESTORE_TIME_EXPIRED,
    WORKSPACE_RESTORE_FAILED: WorkspaceErrors.WORKSPACE_RESTORE_FAILED,
  })
  .input(RestoreWorkspaceSchema)
  .output(ApiResponseSchema(WorkspaceRestoreDataSchema));

/**
 * GET /workspace/{workspaceId}/search
 * Search workspace
 */
export const workspaceSearch = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}/search',
    inputStructure: 'detailed',
    summary: 'Search workspace',
    description: 'Search across workspace members, projects, domains, and links',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
    WORKSPACE_SEARCH_TERM_REQUIRED: WorkspaceErrors.WORKSPACE_SEARCH_TERM_REQUIRED,
    WORKSPACE_SEARCH_TYPE_INVALID: WorkspaceErrors.WORKSPACE_SEARCH_TYPE_INVALID,
    WORKSPACE_SEARCH_UNAVAILABLE: WorkspaceErrors.WORKSPACE_SEARCH_UNAVAILABLE,
  })
  .input(WorkspaceSearchQuerySchema)
  .output(ApiResponseSchema(WorkspaceSearchDataSchema));

/**
 * GET /workspace/{workspaceId}/invite-policy
 * Get workspace invite policy settings
 */
export const getInvitePolicy = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}/invite-policy',
    inputStructure: 'detailed',
    summary: 'Get workspace invite policy',
    description: 'Retrieve workspace invite policy and allowed domains',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
  })
  .input(GetInvitePolicySchema)
  .output(ApiResponseSchema(InvitePolicyDataSchema));

/**
 * PATCH /workspace/{workspaceId}/invite-policy
 * Update workspace invite policy settings
 */
export const updateInvitePolicy = oc
  .route({
    method: 'PATCH',
    path: '/workspace/{workspaceId}/invite-policy',
    inputStructure: 'detailed',
    summary: 'Update workspace invite policy',
    description: 'Update workspace invite policy and allowed domains',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
    WORKSPACE_INVITE_POLICY_DOMAINS_REQUIRED:
      WorkspaceErrors.WORKSPACE_INVITE_POLICY_DOMAINS_REQUIRED,
    WORKSPACE_INVITE_POLICY_DISPOSABLE_DOMAIN:
      WorkspaceErrors.WORKSPACE_INVITE_POLICY_DISPOSABLE_DOMAIN,
    WORKSPACE_INVITE_POLICY_TOO_MANY_DOMAINS:
      WorkspaceErrors.WORKSPACE_INVITE_POLICY_TOO_MANY_DOMAINS,
  })
  .input(UpdateInvitePolicySchema)
  .output(ApiResponseSchema(InvitePolicyUpdateDataSchema));

/**
 * GET /workspace/suggest
 * Suggest workspaces for the current user based on email domain
 * Returns paginated non-private workspaces that match user's email domain
 */
export const suggestWorkspaces = oc
  .route({
    method: 'GET',
    path: '/workspace/suggest',
    inputStructure: 'detailed',
    summary: 'Suggest workspaces',
    description: 'Get suggested workspaces based on email domain',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
  })
  .input(SuggestWorkspacesQuerySchema)
  .output(ApiResponseSchema(SuggestWorkspacesDataSchema));

/**
 * POST /workspace/{workspaceId}/join
 * Join or request access to a workspace
 * For whitelisted workspaces: adds user as member if domain matches
 * For protected workspaces: sends access request to workspace owner
 */
export const joinWorkspace = oc
  .route({
    method: 'POST',
    path: '/workspace/{workspaceId}/join',
    inputStructure: 'detailed',
    summary: 'Join workspace',
    description: 'Join or request access to a workspace based on invite policy',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_GONE: WorkspaceErrors.WORKSPACE_GONE,
    WORKSPACE_MEMBER_ALREADY_EXISTS: WorkspaceErrors.WORKSPACE_MEMBER_ALREADY_EXISTS,
    WORKSPACE_INVITE_POLICY_PRIVATE: WorkspaceErrors.WORKSPACE_INVITE_POLICY_PRIVATE,
    WORKSPACE_INVITE_POLICY_DOMAIN_MISMATCH:
      WorkspaceErrors.WORKSPACE_INVITE_POLICY_DOMAIN_MISMATCH,
  })
  .input(JoinWorkspaceSchema)
  .output(ApiResponseSchema(JoinWorkspaceDataSchema));

/**
 * GET /workspace/access-request/validate
 * Validate access request token and get request details
 * Used by dashboard to display access request review page
 */
export const validateAccessRequest = oc
  .route({
    method: 'GET',
    path: '/workspace/access-request/validate',
    inputStructure: 'detailed',
    summary: 'Validate access request',
    description: 'Validate access request token and get request details',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_ACCESS_REQUEST_INVALID: WorkspaceErrors.WORKSPACE_ACCESS_REQUEST_INVALID,
    WORKSPACE_ACCESS_REQUEST_NOT_OWNER: WorkspaceErrors.WORKSPACE_ACCESS_REQUEST_NOT_OWNER,
  })
  .input(ValidateAccessRequestSchema)
  .output(ApiResponseSchema(ValidateAccessRequestDataSchema));

/**
 * POST /workspace/access-request/approve
 * Approve a workspace access request (owner only)
 * Called from dashboard after owner reviews the request
 */
export const approveAccessRequest = oc
  .route({
    method: 'POST',
    path: '/workspace/access-request/approve',
    inputStructure: 'detailed',
    summary: 'Approve access request',
    description: 'Approve a workspace access request',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_ACCESS_REQUEST_INVALID: WorkspaceErrors.WORKSPACE_ACCESS_REQUEST_INVALID,
    WORKSPACE_ACCESS_REQUEST_NOT_OWNER: WorkspaceErrors.WORKSPACE_ACCESS_REQUEST_NOT_OWNER,
  })
  .input(ApproveAccessRequestSchema)
  .output(ApiResponseSchema(ApproveAccessRequestDataSchema));

/**
 * POST /workspace/access-request/decline
 * Decline a workspace access request (owner only)
 * Called from dashboard after owner reviews the request
 */
export const declineAccessRequest = oc
  .route({
    method: 'POST',
    path: '/workspace/access-request/decline',
    inputStructure: 'detailed',
    summary: 'Decline access request',
    description: 'Decline a workspace access request',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
    WORKSPACE_ACCESS_REQUEST_INVALID: WorkspaceErrors.WORKSPACE_ACCESS_REQUEST_INVALID,
    WORKSPACE_ACCESS_REQUEST_NOT_OWNER: WorkspaceErrors.WORKSPACE_ACCESS_REQUEST_NOT_OWNER,
  })
  .input(DeclineAccessRequestSchema)
  .output(ApiResponseSchema(DeclineAccessRequestDataSchema));

/**
 * GET /workspace/{workspaceId}/status
 * Get workspace status and access info for the current user
 * Does not require membership - returns access status for access gate UI
 * Handles soft-deleted workspaces gracefully
 */
export const getWorkspaceStatus = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}/status',
    inputStructure: 'detailed',
    summary: 'Get workspace status',
    description:
      'Get workspace status and access info without requiring membership. Used to show appropriate UI for non-members.',
    tags: ['Workspaces'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
  })
  .input(GetWorkspaceStatusSchema)
  .output(ApiResponseSchema(WorkspaceStatusDataSchema));
