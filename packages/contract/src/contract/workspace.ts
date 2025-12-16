import { oc } from '@orpc/contract';
import {
  ListWorkspacesQuerySchema,
  WorkspacesListDataSchema,
  CountWorkspacesQuerySchema,
  WorkspaceCountDataSchema,
  WorkspaceByIdDataSchema,
  WorkspacePreferencesGetDataSchema,
  UpdateWorkspacePreferencesSchema,
  WorkspacePreferencesUpdateDataSchema,
  WorkspaceTeamQuerySchema,
  WorkspaceTeamDataSchema,
  UpdateMemberRoleSchema,
  MemberRoleUpdateDataSchema,
  MemberRemoveDataSchema,
  LeaveWorkspaceDataSchema,
  UpdateNotificationPreferencesSchema,
  NotificationPreferencesUpdateDataSchema,
  WorkspaceDomainsQuerySchema,
  WorkspaceDomainsDataSchema,
  DomainByIdDataSchema,
  AddDomainSchema,
  DomainAddDataSchema,
  UpdateDomainSchema,
  DomainUpdateDataSchema,
  DomainDeleteDataSchema,
  DomainVerificationUrlDataSchema,
  DomainRecordingPreferencesDataSchema,
  UpdateDomainRecordingPreferencesSchema,
  DomainRecordingPreferencesUpdateDataSchema,
  ReplaceDomainRecordingPreferencesSchema,
  InviteUrlDataSchema,
  SendInvitesSchema,
  SendInvitesResultSchema,
  UpdateLinkSettingsSchema,
  LinkSettingsDataSchema,
  UpdateWorkspaceNameSchema,
  WorkspaceNameUpdateDataSchema,
  WorkspaceDeleteDataSchema,
  WorkspaceSearchQuerySchema,
  WorkspaceSearchDataSchema,
  ApiResponseSchema,
} from '../schemas';

/**
 * Workspace contract
 * Endpoints for workspace management, members, domains, and settings
 */

/**
 * GET /api/v1/workspace
 * List all user workspaces
 */
export const getAllWorkspaces = oc
  .route({
    method: 'GET',
    path: '/api/v1/workspace',
    summary: 'List workspaces',
    description: 'Retrieve paginated list of workspaces for the current user',
    tags: ['Workspaces'],
  })
  .input(ListWorkspacesQuerySchema)
  .output(ApiResponseSchema(WorkspacesListDataSchema));

/**
 * GET /api/v1/workspace/count
 * Count user workspaces by role
 */
export const countWorkspaces = oc
  .route({
    method: 'GET',
    path: '/api/v1/workspace/count',
    summary: 'Count workspaces',
    description: 'Count workspaces by role for the current user',
    tags: ['Workspaces'],
  })
  .input(CountWorkspacesQuerySchema)
  .output(ApiResponseSchema(WorkspaceCountDataSchema));

/**
 * GET /api/v1/workspace/:id
 * Get workspace by ID
 */
export const getWorkspaceById = oc
  .route({
    method: 'GET',
    path: '/api/v1/workspace/:id',
    summary: 'Get workspace by ID',
    description: 'Retrieve complete workspace details',
    tags: ['Workspaces'],
  })
  .output(ApiResponseSchema(WorkspaceByIdDataSchema));

/**
 * GET /api/v1/workspace/:id/preferences
 * Get workspace preferences
 */
export const getWorkspacePreferences = oc
  .route({
    method: 'GET',
    path: '/api/v1/workspace/:id/preferences',
    summary: 'Get workspace preferences',
    description: 'Retrieve workspace recording and customization preferences',
    tags: ['Workspaces'],
  })
  .output(ApiResponseSchema(WorkspacePreferencesGetDataSchema));

/**
 * PATCH /api/v1/workspace/:id/preferences
 * Update workspace preferences
 */
export const updateWorkspacePreferences = oc
  .route({
    method: 'PATCH',
    path: '/api/v1/workspace/:id/preferences',
    summary: 'Update workspace preferences',
    description: 'Partially update workspace preferences',
    tags: ['Workspaces'],
  })
  .input(UpdateWorkspacePreferencesSchema)
  .output(ApiResponseSchema(WorkspacePreferencesUpdateDataSchema));

/**
 * GET /api/v1/workspace/:id/members
 * Get workspace members
 */
export const getWorkspaceMembers = oc
  .route({
    method: 'GET',
    path: '/api/v1/workspace/:id/members',
    summary: 'Get workspace members',
    description: 'Retrieve paginated list of workspace team members',
    tags: ['Workspaces'],
  })
  .input(WorkspaceTeamQuerySchema)
  .output(ApiResponseSchema(WorkspaceTeamDataSchema));

/**
 * PATCH /api/v1/workspace/:id/members/:workspaceMemberId
 * Update member role
 */
export const updateMemberRole = oc
  .route({
    method: 'PATCH',
    path: '/api/v1/workspace/:id/members/:workspaceMemberId',
    summary: 'Update member role',
    description: 'Update workspace member role',
    tags: ['Workspaces'],
  })
  .input(UpdateMemberRoleSchema)
  .output(ApiResponseSchema(MemberRoleUpdateDataSchema));

/**
 * DELETE /api/v1/workspace/:id/members/:workspaceMemberId
 * Remove workspace member
 */
export const removeMember = oc
  .route({
    method: 'DELETE',
    path: '/api/v1/workspace/:id/members/:workspaceMemberId',
    summary: 'Remove member',
    description: 'Remove a member from the workspace',
    tags: ['Workspaces'],
  })
  .output(ApiResponseSchema(MemberRemoveDataSchema));

/**
 * POST /api/v1/workspace/:id/leave
 * Leave workspace
 */
export const leaveWorkspace = oc
  .route({
    method: 'POST',
    path: '/api/v1/workspace/:id/leave',
    summary: 'Leave workspace',
    description: 'Leave a workspace as a member',
    tags: ['Workspaces'],
  })
  .output(ApiResponseSchema(LeaveWorkspaceDataSchema));

/**
 * PATCH /api/v1/workspace/:id/notifications
 * Update notification preferences
 */
export const updateNotificationPreferences = oc
  .route({
    method: 'PATCH',
    path: '/api/v1/workspace/:id/notifications',
    summary: 'Update notification preferences',
    description: 'Update workspace notification preferences for current user',
    tags: ['Workspaces'],
  })
  .input(UpdateNotificationPreferencesSchema)
  .output(ApiResponseSchema(NotificationPreferencesUpdateDataSchema));

/**
 * GET /api/v1/workspace/:id/invite
 * Get workspace invite URL
 */
export const getInviteUrl = oc
  .route({
    method: 'GET',
    path: '/api/v1/workspace/:id/invite',
    summary: 'Get invite URL',
    description: 'Retrieve workspace invite URL',
    tags: ['Workspaces'],
  })
  .output(ApiResponseSchema(InviteUrlDataSchema));

/**
 * POST /api/v1/workspace/:id/invite/rotate
 * Rotate invite token
 */
export const rotateInviteToken = oc
  .route({
    method: 'POST',
    path: '/api/v1/workspace/:id/invite/rotate',
    summary: 'Rotate invite token',
    description: 'Generate new workspace invite URL',
    tags: ['Workspaces'],
  })
  .output(ApiResponseSchema(InviteUrlDataSchema));

/**
 * POST /api/v1/workspace/:id/invite
 * Send workspace invitations
 */
export const sendWorkspaceInvites = oc
  .route({
    method: 'POST',
    path: '/api/v1/workspace/:id/invite',
    summary: 'Send workspace invitations',
    description: 'Send workspace invitations to multiple email addresses',
    tags: ['Workspaces'],
  })
  .input(SendInvitesSchema)
  .output(ApiResponseSchema(SendInvitesResultSchema));

/**
 * GET /api/v1/workspace/:id/domains
 * Get workspace domains
 */
export const getWorkspaceDomains = oc
  .route({
    method: 'GET',
    path: '/api/v1/workspace/:id/domains',
    summary: 'Get workspace domains',
    description: 'Retrieve paginated list of workspace domains',
    tags: ['Workspaces'],
  })
  .input(WorkspaceDomainsQuerySchema)
  .output(ApiResponseSchema(WorkspaceDomainsDataSchema));

/**
 * GET /api/v1/workspace/:id/domains/:domainId
 * Get domain by ID
 */
export const getDomainById = oc
  .route({
    method: 'GET',
    path: '/api/v1/workspace/:id/domains/:domainId',
    summary: 'Get domain by ID',
    description: 'Retrieve complete domain details including recording preferences',
    tags: ['Workspaces'],
  })
  .output(ApiResponseSchema(DomainByIdDataSchema));

/**
 * POST /api/v1/workspace/:id/domains
 * Add domain to workspace
 */
export const addDomain = oc
  .route({
    method: 'POST',
    path: '/api/v1/workspace/:id/domains',
    summary: 'Add domain',
    description: 'Add a new domain to the workspace',
    tags: ['Workspaces'],
  })
  .input(AddDomainSchema)
  .output(ApiResponseSchema(DomainAddDataSchema));

/**
 * PATCH /api/v1/workspace/:id/domains/:domainId
 * Update domain
 */
export const updateDomain = oc
  .route({
    method: 'PATCH',
    path: '/api/v1/workspace/:id/domains/:domainId',
    summary: 'Update domain',
    description: 'Update domain URL',
    tags: ['Workspaces'],
  })
  .input(UpdateDomainSchema)
  .output(ApiResponseSchema(DomainUpdateDataSchema));

/**
 * DELETE /api/v1/workspace/:id/domains/:domainId
 * Delete domain
 */
export const deleteDomain = oc
  .route({
    method: 'DELETE',
    path: '/api/v1/workspace/:id/domains/:domainId',
    summary: 'Delete domain',
    description: 'Remove a domain from the workspace',
    tags: ['Workspaces'],
  })
  .output(ApiResponseSchema(DomainDeleteDataSchema));

/**
 * GET /api/v1/workspace/:id/domains/:domainId/verify
 * Get domain verification URL
 */
export const getDomainVerificationUrl = oc
  .route({
    method: 'GET',
    path: '/api/v1/workspace/:id/domains/:domainId/verify',
    summary: 'Get domain verification URL',
    description: 'Generate domain verification URL',
    tags: ['Workspaces'],
  })
  .output(ApiResponseSchema(DomainVerificationUrlDataSchema));

/**
 * GET /api/v1/workspace/:id/domains/:domainId/preferences
 * Get domain recording preferences
 */
export const getDomainRecordingPreferences = oc
  .route({
    method: 'GET',
    path: '/api/v1/workspace/:id/domains/:domainId/preferences',
    summary: 'Get domain recording preferences',
    description: 'Retrieve recording preferences for a specific domain',
    tags: ['Workspaces'],
  })
  .output(ApiResponseSchema(DomainRecordingPreferencesDataSchema));

/**
 * PATCH /api/v1/workspace/:id/domains/:domainId/preferences
 * Update domain recording preferences (partial update)
 */
export const updateDomainRecordingPreferences = oc
  .route({
    method: 'PATCH',
    path: '/api/v1/workspace/:id/domains/:domainId/preferences',
    summary: 'Update domain recording preferences',
    description: 'Partially update recording preferences for a specific domain',
    tags: ['Workspaces'],
  })
  .input(UpdateDomainRecordingPreferencesSchema)
  .output(ApiResponseSchema(DomainRecordingPreferencesUpdateDataSchema));

/**
 * PUT /api/v1/workspace/:id/domains/:domainId/preferences
 * Replace domain recording preferences (full replacement)
 */
export const replaceDomainRecordingPreferences = oc
  .route({
    method: 'PUT',
    path: '/api/v1/workspace/:id/domains/:domainId/preferences',
    summary: 'Replace domain recording preferences',
    description: 'Replace all recording preferences for a specific domain',
    tags: ['Workspaces'],
  })
  .input(ReplaceDomainRecordingPreferencesSchema)
  .output(ApiResponseSchema(DomainRecordingPreferencesUpdateDataSchema));

/**
 * PUT /api/v1/workspace/:id/preferences/link
 * Update link branding settings
 */
export const updateLinkSettings = oc
  .route({
    method: 'PUT',
    path: '/api/v1/workspace/:id/preferences/link',
    summary: 'Update link settings',
    description: 'Update recording link branding and customization settings',
    tags: ['Workspaces'],
  })
  .input(UpdateLinkSettingsSchema)
  .output(ApiResponseSchema(LinkSettingsDataSchema));

/**
 * PATCH /api/v1/workspace/:workspaceId
 * Update workspace name
 */
export const updateWorkspaceName = oc
  .route({
    method: 'PATCH',
    path: '/api/v1/workspace/:workspaceId',
    summary: 'Update workspace name',
    description: 'Update workspace name',
    tags: ['Workspaces'],
  })
  .input(UpdateWorkspaceNameSchema)
  .output(ApiResponseSchema(WorkspaceNameUpdateDataSchema));

/**
 * DELETE /api/v1/workspace/:workspaceId
 * Delete workspace
 */
export const deleteWorkspace = oc
  .route({
    method: 'DELETE',
    path: '/api/v1/workspace/:workspaceId',
    summary: 'Delete workspace',
    description: 'Permanently delete a workspace',
    tags: ['Workspaces'],
  })
  .output(ApiResponseSchema(WorkspaceDeleteDataSchema));

/**
 * GET /api/v1/workspace/:workspaceId/search
 * Search workspace
 */
export const workspaceSearch = oc
  .route({
    method: 'GET',
    path: '/api/v1/workspace/:workspaceId/search',
    summary: 'Search workspace',
    description: 'Search across workspace members, projects, domains, and links',
    tags: ['Workspaces'],
  })
  .input(WorkspaceSearchQuerySchema)
  .output(ApiResponseSchema(WorkspaceSearchDataSchema));
