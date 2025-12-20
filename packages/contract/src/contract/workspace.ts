import { oc } from '@orpc/contract';
import {
  ListWorkspacesQuerySchema,
  WorkspacesListDataSchema,
  CountWorkspacesQuerySchema,
  WorkspaceCountDataSchema,
  WorkspaceByIdSchema,
  WorkspaceByIdDataSchema,
  WorkspacePreferencesGetSchema,
  WorkspacePreferencesGetDataSchema,
  UpdateWorkspacePreferencesSchema,
  WorkspacePreferencesUpdateDataSchema,
  WorkspaceTeamQuerySchema,
  WorkspaceTeamDataSchema,
  UpdateMemberRoleSchema,
  MemberRoleUpdateDataSchema,
  RemoveMemberSchema,
  MemberRemoveDataSchema,
  LeaveWorkspaceSchema,
  LeaveWorkspaceDataSchema,
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
  InviteUrlSchema,
  InviteUrlDataSchema,
  SendWorkspaceInvitesSchema,
  SendInvitesResultSchema,
  UpdateLinkSettingsSchema,
  LinkSettingsDataSchema,
  UpdateWorkspaceNameSchema,
  WorkspaceNameUpdateDataSchema,
  DeleteWorkspaceSchema,
  WorkspaceDeleteDataSchema,
  WorkspaceSearchQuerySchema,
  WorkspaceSearchDataSchema,
  ApiResponseSchema,
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
    spec: {
      summary: 'List workspaces',
      description: 'Retrieve paginated list of workspaces for the current user',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
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
    spec: {
      summary: 'Count workspaces',
      description: 'Count workspaces by role for the current user',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(CountWorkspacesQuerySchema)
  .output(ApiResponseSchema(WorkspaceCountDataSchema));

/**
 * GET /workspace/:workspaceId
 * Get workspace by ID
 */
export const getWorkspaceById = oc
  .route({
    method: 'GET',
    path: '/workspace/:workspaceId',
    inputStructure: 'detailed',
    spec: {
      summary: 'Get workspace by ID',
      description: 'Retrieve complete workspace details',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(WorkspaceByIdSchema)
  .output(ApiResponseSchema(WorkspaceByIdDataSchema));

/**
 * GET /workspace/:workspaceId/preferences
 * Get workspace preferences
 */
export const getWorkspacePreferences = oc
  .route({
    method: 'GET',
    path: '/workspace/:workspaceId/preferences',
    inputStructure: 'detailed',
    spec: {
      summary: 'Get workspace preferences',
      description: 'Retrieve workspace recording and customization preferences',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(WorkspacePreferencesGetSchema)
  .output(ApiResponseSchema(WorkspacePreferencesGetDataSchema));

/**
 * PATCH /workspace/:workspaceId/preferences
 * Update workspace preferences
 */
export const updateWorkspacePreferences = oc
  .route({
    method: 'PATCH',
    path: '/workspace/:workspaceId/preferences',
    inputStructure: 'detailed',
    spec: {
      summary: 'Update workspace preferences',
      description: 'Partially update workspace preferences',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(UpdateWorkspacePreferencesSchema)
  .output(ApiResponseSchema(WorkspacePreferencesUpdateDataSchema));

/**
 * GET /workspace/:workspaceId/members
 * Get workspace members
 */
export const getWorkspaceMembers = oc
  .route({
    method: 'GET',
    path: '/workspace/:workspaceId/members',
    inputStructure: 'detailed',
    spec: {
      summary: 'Get workspace members',
      description: 'Retrieve paginated list of workspace team members',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(WorkspaceTeamQuerySchema)
  .output(ApiResponseSchema(WorkspaceTeamDataSchema));

/**
 * PATCH /workspace/:workspaceId/members/:workspaceMemberId
 * Update member role
 */
export const updateMemberRole = oc
  .route({
    method: 'PATCH',
    path: '/workspace/:workspaceId/members/:workspaceMemberId',
    inputStructure: 'detailed',
    spec: {
      summary: 'Update member role',
      description: 'Update workspace member role',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(UpdateMemberRoleSchema)
  .output(ApiResponseSchema(MemberRoleUpdateDataSchema));

/**
 * DELETE /workspace/:workspaceId/members/:workspaceMemberId
 * Remove workspace member
 */
export const removeMember = oc
  .route({
    method: 'DELETE',
    path: '/workspace/:workspaceId/members/:workspaceMemberId',
    inputStructure: 'detailed',
    spec: {
      summary: 'Remove member',
      description: 'Remove a member from the workspace',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(RemoveMemberSchema)
  .output(ApiResponseSchema(MemberRemoveDataSchema));

/**
 * POST /workspace/:workspaceId/leave
 * Leave workspace
 */
export const leaveWorkspace = oc
  .route({
    method: 'POST',
    path: '/workspace/:workspaceId/leave',
    inputStructure: 'detailed',
    spec: {
      summary: 'Leave workspace',
      description: 'Leave a workspace as a member',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(LeaveWorkspaceSchema)
  .output(ApiResponseSchema(LeaveWorkspaceDataSchema));

/**
 * PATCH /workspace/:workspaceId/notifications
 * Update notification preferences
 */
export const updateNotificationPreferences = oc
  .route({
    method: 'PATCH',
    path: '/workspace/:workspaceId/notifications',
    inputStructure: 'detailed',
    spec: {
      summary: 'Update notification preferences',
      description: 'Update workspace notification preferences for current user',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(UpdateNotificationPreferencesSchema)
  .output(ApiResponseSchema(NotificationPreferencesUpdateDataSchema));

/**
 * GET /workspace/:workspaceId/invite
 * Get workspace invite URL
 */
export const getInviteUrl = oc
  .route({
    method: 'GET',
    path: '/workspace/:workspaceId/invite',
    inputStructure: 'detailed',
    spec: {
      summary: 'Get invite URL',
      description: 'Retrieve workspace invite URL',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(InviteUrlSchema)
  .output(ApiResponseSchema(InviteUrlDataSchema));

/**
 * POST /workspace/:workspaceId/invite/rotate
 * Rotate invite token
 */
export const rotateInviteToken = oc
  .route({
    method: 'POST',
    path: '/workspace/:workspaceId/invite/rotate',
    inputStructure: 'detailed',
    spec: {
      summary: 'Rotate invite token',
      description: 'Generate new workspace invite URL',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(InviteUrlSchema)
  .output(ApiResponseSchema(InviteUrlDataSchema));

/**
 * POST /workspace/:workspaceId/invite
 * Send workspace invitations
 */
export const sendWorkspaceInvites = oc
  .route({
    method: 'POST',
    path: '/workspace/:workspaceId/invite',
    inputStructure: 'detailed',
    spec: {
      summary: 'Send workspace invitations',
      description: 'Send workspace invitations to multiple email addresses',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(SendWorkspaceInvitesSchema)
  .output(ApiResponseSchema(SendInvitesResultSchema));

/**
 * GET /workspace/:workspaceId/domains
 * Get workspace domains
 */
export const getWorkspaceDomains = oc
  .route({
    method: 'GET',
    path: '/workspace/:workspaceId/domains',
    inputStructure: 'detailed',
    spec: {
      summary: 'Get workspace domains',
      description: 'Retrieve paginated list of workspace domains',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(WorkspaceDomainsQuerySchema)
  .output(ApiResponseSchema(WorkspaceDomainsDataSchema));

/**
 * GET /workspace/:workspaceId/domains/:domainId
 * Get domain by ID
 */
export const getDomainById = oc
  .route({
    method: 'GET',
    path: '/workspace/:workspaceId/domains/:domainId',
    inputStructure: 'detailed',
    spec: {
      summary: 'Get domain by ID',
      description: 'Retrieve complete domain details including recording preferences',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(DomainByIdSchema)
  .output(ApiResponseSchema(DomainByIdDataSchema));

/**
 * POST /workspace/:workspaceId/domains
 * Add domain to workspace
 */
export const addDomain = oc
  .route({
    method: 'POST',
    path: '/workspace/:workspaceId/domains',
    inputStructure: 'detailed',
    spec: {
      summary: 'Add domain',
      description: 'Add a new domain to the workspace',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(AddDomainSchema)
  .output(ApiResponseSchema(DomainAddDataSchema));

/**
 * PATCH /workspace/:workspaceId/domains/:domainId
 * Update domain
 */
export const updateDomain = oc
  .route({
    method: 'PATCH',
    path: '/workspace/:workspaceId/domains/:domainId',
    inputStructure: 'detailed',
    spec: {
      summary: 'Update domain',
      description: 'Update domain URL',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(UpdateDomainSchema)
  .output(ApiResponseSchema(DomainUpdateDataSchema));

/**
 * DELETE /workspace/:workspaceId/domains/:domainId
 * Delete domain
 */
export const deleteDomain = oc
  .route({
    method: 'DELETE',
    path: '/workspace/:workspaceId/domains/:domainId',
    inputStructure: 'detailed',
    spec: {
      summary: 'Delete domain',
      description: 'Remove a domain from the workspace',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(DeleteDomainSchema)
  .output(ApiResponseSchema(DomainDeleteDataSchema));

/**
 * GET /workspace/:workspaceId/domains/:domainId/verify
 * Get domain verification URL
 */
export const getDomainVerificationUrl = oc
  .route({
    method: 'GET',
    path: '/workspace/:workspaceId/domains/:domainId/verify',
    inputStructure: 'detailed',
    spec: {
      summary: 'Get domain verification URL',
      description: 'Generate domain verification URL',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(DomainVerificationUrlSchema)
  .output(ApiResponseSchema(DomainVerificationUrlDataSchema));

/**
 * GET /workspace/:workspaceId/domains/:domainId/preferences
 * Get domain recording preferences
 */
export const getDomainRecordingPreferences = oc
  .route({
    method: 'GET',
    path: '/workspace/:workspaceId/domains/:domainId/preferences',
    inputStructure: 'detailed',
    spec: {
      summary: 'Get domain recording preferences',
      description: 'Retrieve recording preferences for a specific domain',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(GetDomainRecordingPreferencesSchema)
  .output(ApiResponseSchema(DomainRecordingPreferencesDataSchema));

/**
 * PATCH /workspace/:workspaceId/domains/:domainId/preferences
 * Update domain recording preferences (partial update)
 */
export const updateDomainRecordingPreferences = oc
  .route({
    method: 'PATCH',
    path: '/workspace/:workspaceId/domains/:domainId/preferences',
    inputStructure: 'detailed',
    spec: {
      summary: 'Update domain recording preferences',
      description: 'Partially update recording preferences for a specific domain',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(UpdateDomainRecordingPreferencesSchema)
  .output(ApiResponseSchema(DomainRecordingPreferencesUpdateDataSchema));

/**
 * PUT /workspace/:workspaceId/domains/:domainId/preferences
 * Replace domain recording preferences (full replacement)
 */
export const replaceDomainRecordingPreferences = oc
  .route({
    method: 'PUT',
    path: '/workspace/:workspaceId/domains/:domainId/preferences',
    inputStructure: 'detailed',
    spec: {
      summary: 'Replace domain recording preferences',
      description: 'Replace all recording preferences for a specific domain',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(ReplaceDomainRecordingPreferencesSchema)
  .output(ApiResponseSchema(DomainRecordingPreferencesUpdateDataSchema));

/**
 * PUT /workspace/:workspaceId/preferences/link
 * Update link branding settings
 */
export const updateLinkSettings = oc
  .route({
    method: 'PUT',
    path: '/workspace/:workspaceId/preferences/link',
    inputStructure: 'detailed',
    spec: {
      summary: 'Update link settings',
      description: 'Update recording link branding and customization settings',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(UpdateLinkSettingsSchema)
  .output(ApiResponseSchema(LinkSettingsDataSchema));

/**
 * PATCH /workspace/:workspaceId
 * Update workspace name
 */
export const updateWorkspaceName = oc
  .route({
    method: 'PATCH',
    path: '/workspace/:workspaceId',
    inputStructure: 'detailed',
    spec: {
      summary: 'Update workspace name',
      description: 'Update workspace name',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(UpdateWorkspaceNameSchema)
  .output(ApiResponseSchema(WorkspaceNameUpdateDataSchema));

/**
 * DELETE /workspace/:workspaceId
 * Delete workspace
 */
export const deleteWorkspace = oc
  .route({
    method: 'DELETE',
    path: '/workspace/:workspaceId',
    inputStructure: 'detailed',
    spec: {
      summary: 'Delete workspace',
      description: 'Permanently delete a workspace',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(DeleteWorkspaceSchema)
  .output(ApiResponseSchema(WorkspaceDeleteDataSchema));

/**
 * GET /workspace/:workspaceId/search
 * Search workspace
 */
export const workspaceSearch = oc
  .route({
    method: 'GET',
    path: '/workspace/:workspaceId/search',
    inputStructure: 'detailed',
    spec: {
      summary: 'Search workspace',
      description: 'Search across workspace members, projects, domains, and links',
      tags: ['Workspaces'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(WorkspaceSearchQuerySchema)
  .output(ApiResponseSchema(WorkspaceSearchDataSchema));
