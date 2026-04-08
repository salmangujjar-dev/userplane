/**
 * Public API contract
 * API-key authenticated endpoints under /public/workspace/{workspaceId}/...
 * Reuses existing schemas from internal API for input/output.
 */

import { oc } from '@orpc/contract';

import {
  ApiResponseSchema,
  BillingErrors,
  CreateLinkSchema,
  DeleteLinkSchema,
  DeleteRecordingSchema,
  InviteUrlDataSchema,
  LinkByIdSchema,
  LinkCreateDataSchema,
  LinkDeleteDataSchema,
  LinkErrors,
  LinkGetDataSchema,
  LinksListDataSchema,
  LinkUpdateDataSchema,
  ListLinksQuerySchema,
  ListProjectsQuerySchema,
  ListRecordingsQuerySchema,
  ListWorkspacesQuerySchema,
  ProjectByIdDataSchema,
  ProjectByIdSchema,
  ProjectErrors,
  ProjectsListDataSchema,
  RecordingByIdSchema,
  RecordingDeleteDataSchema,
  RecordingDetailDataSchema,
  RecordingErrors,
  RecordingResourceDataSchema,
  RecordingsListDataSchema,
  UpdateLinkSchema,
  WorkspaceByIdDataSchema,
  WorkspaceByIdSchema,
  WorkspaceErrors,
  WorkspacesListDataSchema,
} from '../schemas';
import { PublicApiErrors } from './errors';
import { MeDataSchema } from './schemas';

// =============================================================================
// Common public API errors (included on every endpoint)
// =============================================================================

const publicErrors = {
  API_KEY_REQUIRED: PublicApiErrors.API_KEY_REQUIRED,
  API_KEY_INVALID: PublicApiErrors.API_KEY_INVALID,
  API_KEY_EXPIRED: PublicApiErrors.API_KEY_EXPIRED,
  API_KEY_DISABLED: PublicApiErrors.API_KEY_DISABLED,
  NOT_A_MEMBER: PublicApiErrors.NOT_A_MEMBER,
  RATE_LIMITED: PublicApiErrors.RATE_LIMITED,
};

// =============================================================================
// Links
// =============================================================================

export const listLinks = oc
  .route({
    method: 'GET',
    path: '/public/workspace/{workspaceId}/links',
    inputStructure: 'detailed',
    summary: 'List recording links',
    description: 'Retrieve paginated list of recording links with optional filters',
    tags: ['Public API - Links'],
  })
  .errors({ ...publicErrors })
  .input(ListLinksQuerySchema)
  .output(ApiResponseSchema(LinksListDataSchema));

export const createLink = oc
  .route({
    method: 'POST',
    path: '/public/workspace/{workspaceId}/links',
    inputStructure: 'detailed',
    summary: 'Create recording link',
    description: 'Create a new recording link for a domain',
    tags: ['Public API - Links'],
  })
  .errors({
    ...publicErrors,
    LINK_NOT_FOUND: LinkErrors.LINK_NOT_FOUND,
    LINK_DEFAULT_PROJECT_NOT_FOUND: LinkErrors.LINK_DEFAULT_PROJECT_NOT_FOUND,
    LINK_PROJECT_DELETED: LinkErrors.LINK_PROJECT_DELETED,
    LINK_CREATE_FAILED: LinkErrors.LINK_CREATE_FAILED,
    PLAN_LIMIT_EXCEEDED: BillingErrors.PLAN_LIMIT_EXCEEDED,
  })
  .input(CreateLinkSchema)
  .output(ApiResponseSchema(LinkCreateDataSchema));

export const getLinkById = oc
  .route({
    method: 'GET',
    path: '/public/workspace/{workspaceId}/links/{linkId}',
    inputStructure: 'detailed',
    summary: 'Get recording link',
    description: 'Retrieve recording link details by ID',
    tags: ['Public API - Links'],
  })
  .errors({
    ...publicErrors,
    LINK_NOT_FOUND: LinkErrors.LINK_NOT_FOUND,
    LINK_GONE: LinkErrors.LINK_GONE,
  })
  .input(LinkByIdSchema)
  .output(ApiResponseSchema(LinkGetDataSchema));

export const updateLink = oc
  .route({
    method: 'PUT',
    path: '/public/workspace/{workspaceId}/links/{linkId}',
    inputStructure: 'detailed',
    summary: 'Update recording link',
    description: 'Update recording link settings',
    tags: ['Public API - Links'],
  })
  .errors({
    ...publicErrors,
    LINK_NOT_FOUND: LinkErrors.LINK_NOT_FOUND,
    LINK_GONE: LinkErrors.LINK_GONE,
    LINK_UPDATE_FAILED: LinkErrors.LINK_UPDATE_FAILED,
  })
  .input(UpdateLinkSchema)
  .output(ApiResponseSchema(LinkUpdateDataSchema));

export const deleteLink = oc
  .route({
    method: 'DELETE',
    path: '/public/workspace/{workspaceId}/links/{linkId}',
    inputStructure: 'detailed',
    summary: 'Delete recording link',
    description: 'Delete a recording link',
    tags: ['Public API - Links'],
  })
  .errors({
    ...publicErrors,
    LINK_NOT_FOUND: LinkErrors.LINK_NOT_FOUND,
    LINK_GONE: LinkErrors.LINK_GONE,
    LINK_DELETE_FORBIDDEN: LinkErrors.LINK_DELETE_FORBIDDEN,
    LINK_DELETE_FAILED: LinkErrors.LINK_DELETE_FAILED,
  })
  .input(DeleteLinkSchema)
  .output(ApiResponseSchema(LinkDeleteDataSchema));

// =============================================================================
// Recordings
// =============================================================================

export const listRecordings = oc
  .route({
    method: 'GET',
    path: '/public/workspace/{workspaceId}/recordings',
    inputStructure: 'detailed',
    summary: 'List recordings',
    description: 'Retrieve paginated list of recordings with optional filters',
    tags: ['Public API - Recordings'],
  })
  .errors({ ...publicErrors })
  .input(ListRecordingsQuerySchema)
  .output(ApiResponseSchema(RecordingsListDataSchema));

export const getRecordingById = oc
  .route({
    method: 'GET',
    path: '/public/workspace/{workspaceId}/recordings/{recordingId}',
    inputStructure: 'detailed',
    summary: 'Get recording',
    description: 'Retrieve complete recording details',
    tags: ['Public API - Recordings'],
  })
  .errors({
    ...publicErrors,
    RECORDING_NOT_FOUND: RecordingErrors.RECORDING_NOT_FOUND,
    RECORDING_GONE: RecordingErrors.RECORDING_GONE,
  })
  .input(RecordingByIdSchema)
  .output(ApiResponseSchema(RecordingDetailDataSchema));

export const deleteRecording = oc
  .route({
    method: 'DELETE',
    path: '/public/workspace/{workspaceId}/recordings/{recordingId}',
    inputStructure: 'detailed',
    summary: 'Delete recording',
    description: 'Soft delete a recording',
    tags: ['Public API - Recordings'],
  })
  .errors({
    ...publicErrors,
    RECORDING_NOT_FOUND: RecordingErrors.RECORDING_NOT_FOUND,
    RECORDING_GONE: RecordingErrors.RECORDING_GONE,
    RECORDING_WORKSPACE_MISMATCH: RecordingErrors.RECORDING_WORKSPACE_MISMATCH,
    RECORDING_DELETE_FORBIDDEN: RecordingErrors.RECORDING_DELETE_FORBIDDEN,
    RECORDING_DELETE_FAILED: RecordingErrors.RECORDING_DELETE_FAILED,
  })
  .input(DeleteRecordingSchema)
  .output(ApiResponseSchema(RecordingDeleteDataSchema));

export const getRecordingVideo = oc
  .route({
    method: 'GET',
    path: '/public/workspace/{workspaceId}/recordings/{recordingId}/video',
    inputStructure: 'detailed',
    summary: 'Get recording video',
    description: 'Retrieve presigned URL for recording video',
    tags: ['Public API - Recordings'],
  })
  .errors({
    ...publicErrors,
    RECORDING_NOT_FOUND: RecordingErrors.RECORDING_NOT_FOUND,
    RECORDING_GONE: RecordingErrors.RECORDING_GONE,
  })
  .input(RecordingByIdSchema)
  .output(ApiResponseSchema(RecordingResourceDataSchema));

export const getRecordingThumbnail = oc
  .route({
    method: 'GET',
    path: '/public/workspace/{workspaceId}/recordings/{recordingId}/thumbnail',
    inputStructure: 'detailed',
    summary: 'Get recording thumbnail',
    description: 'Retrieve presigned URL for recording thumbnail',
    tags: ['Public API - Recordings'],
  })
  .errors({
    ...publicErrors,
    RECORDING_NOT_FOUND: RecordingErrors.RECORDING_NOT_FOUND,
    RECORDING_GONE: RecordingErrors.RECORDING_GONE,
  })
  .input(RecordingByIdSchema)
  .output(ApiResponseSchema(RecordingResourceDataSchema));

export const getRecordingConsoleLog = oc
  .route({
    method: 'GET',
    path: '/public/workspace/{workspaceId}/recordings/{recordingId}/console-log',
    inputStructure: 'detailed',
    summary: 'Get recording console log',
    description: 'Retrieve presigned URL for recording console log',
    tags: ['Public API - Recordings'],
  })
  .errors({
    ...publicErrors,
    RECORDING_NOT_FOUND: RecordingErrors.RECORDING_NOT_FOUND,
    RECORDING_GONE: RecordingErrors.RECORDING_GONE,
  })
  .input(RecordingByIdSchema)
  .output(ApiResponseSchema(RecordingResourceDataSchema));

export const getRecordingNetworkLog = oc
  .route({
    method: 'GET',
    path: '/public/workspace/{workspaceId}/recordings/{recordingId}/network-log',
    inputStructure: 'detailed',
    summary: 'Get recording network log',
    description: 'Retrieve presigned URL for recording network log',
    tags: ['Public API - Recordings'],
  })
  .errors({
    ...publicErrors,
    RECORDING_NOT_FOUND: RecordingErrors.RECORDING_NOT_FOUND,
    RECORDING_GONE: RecordingErrors.RECORDING_GONE,
  })
  .input(RecordingByIdSchema)
  .output(ApiResponseSchema(RecordingResourceDataSchema));

export const getRecordingAction = oc
  .route({
    method: 'GET',
    path: '/public/workspace/{workspaceId}/recordings/{recordingId}/action',
    inputStructure: 'detailed',
    summary: 'Get recording action replay',
    description: 'Retrieve presigned URL for recording client action log',
    tags: ['Public API - Recordings'],
  })
  .errors({
    ...publicErrors,
    RECORDING_NOT_FOUND: RecordingErrors.RECORDING_NOT_FOUND,
    RECORDING_GONE: RecordingErrors.RECORDING_GONE,
  })
  .input(RecordingByIdSchema)
  .output(ApiResponseSchema(RecordingResourceDataSchema));

// =============================================================================
// Workspace (read-only)
// =============================================================================

// =============================================================================
// Me (user-scoped, no workspaceId)
// =============================================================================

export const getMe = oc
  .route({
    method: 'GET',
    path: '/public/me',
    summary: 'Get current user profile',
    description: "Retrieve the authenticated user's profile and aggregate stats",
    tags: ['Public API - Me'],
  })
  .errors({ ...publicErrors })
  .output(ApiResponseSchema(MeDataSchema));

// =============================================================================
// Workspaces (user-scoped, no workspaceId)
// =============================================================================

export const listWorkspaces = oc
  .route({
    method: 'GET',
    path: '/public/workspaces',
    inputStructure: 'detailed',
    summary: 'List workspaces',
    description: 'Retrieve paginated list of workspaces for the authenticated user',
    tags: ['Public API - Workspace'],
  })
  .errors({ ...publicErrors })
  .input(ListWorkspacesQuerySchema)
  .output(ApiResponseSchema(WorkspacesListDataSchema));

export const getWorkspace = oc
  .route({
    method: 'GET',
    path: '/public/workspace/{workspaceId}',
    inputStructure: 'detailed',
    summary: 'Get workspace',
    description: 'Retrieve workspace details',
    tags: ['Public API - Workspace'],
  })
  .errors({
    ...publicErrors,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
  })
  .input(WorkspaceByIdSchema)
  .output(ApiResponseSchema(WorkspaceByIdDataSchema));

export const getInviteUrl = oc
  .route({
    method: 'GET',
    path: '/public/workspace/{workspaceId}/invite-url',
    inputStructure: 'detailed',
    summary: 'Get invite URL',
    description: 'Retrieve workspace invite URL',
    tags: ['Public API - Workspace'],
  })
  .errors({
    ...publicErrors,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
  })
  .input(WorkspaceByIdSchema)
  .output(ApiResponseSchema(InviteUrlDataSchema));

// =============================================================================
// Projects (read-only)
// =============================================================================

export const listProjects = oc
  .route({
    method: 'GET',
    path: '/public/workspace/{workspaceId}/projects',
    inputStructure: 'detailed',
    summary: 'List projects',
    description: 'Retrieve paginated list of projects',
    tags: ['Public API - Projects'],
  })
  .errors({
    ...publicErrors,
    FORBIDDEN: ProjectErrors.FORBIDDEN,
  })
  .input(ListProjectsQuerySchema)
  .output(ApiResponseSchema(ProjectsListDataSchema));

export const getProjectById = oc
  .route({
    method: 'GET',
    path: '/public/workspace/{workspaceId}/projects/{projectId}',
    inputStructure: 'detailed',
    summary: 'Get project',
    description: 'Retrieve project details by ID',
    tags: ['Public API - Projects'],
  })
  .errors({
    ...publicErrors,
    PROJECT_NOT_FOUND: ProjectErrors.PROJECT_NOT_FOUND,
    PROJECT_GONE: ProjectErrors.PROJECT_GONE,
  })
  .input(ProjectByIdSchema)
  .output(ApiResponseSchema(ProjectByIdDataSchema));
