import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  ListLinksQuerySchema,
  LinksListDataSchema,
  CreateLinkSchema,
  LinkCreateDataSchema,
  LinkByIdSchema,
  UpdateLinkSchema,
  LinkUpdateDataSchema,
  LinkGetDataSchema,
  DeleteLinkSchema,
  LinkDeleteDataSchema,
  ApiResponseSchema,
  LinkErrors,
} from '../schemas';

/**
 * Link contract
 * Endpoints for recording link operations
 * All endpoints require cookie-based authentication (userplane.session_token)
 */

/**
 * GET /workspace/{workspaceId}/links
 * List links with pagination and filtering
 */
export const getLinks = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}/links',
    inputStructure: 'detailed',
    summary: 'List links',
    description: 'Retrieve paginated list of recording links with optional filters',
    tags: ['Links'],
  })
  .errors({
    LINK_PAGE_INVALID: LinkErrors.LINK_PAGE_INVALID,
    LINK_PER_PAGE_INVALID: LinkErrors.LINK_PER_PAGE_INVALID,
  })
  .input(ListLinksQuerySchema)
  .output(ApiResponseSchema(LinksListDataSchema));

/**
 * POST /workspace/{workspaceId}/links
 * Create a new recording link
 */
export const createLink = oc
  .route({
    method: 'POST',
    path: '/workspace/{workspaceId}/links',
    inputStructure: 'detailed',
    summary: 'Create link',
    description: 'Create a new recording link for a domain',
    tags: ['Links'],
  })
  .errors({
    LINK_WORKSPACE_DELETED: LinkErrors.LINK_WORKSPACE_DELETED,
    LINK_MEMBER_NOT_FOUND: LinkErrors.LINK_MEMBER_NOT_FOUND,
    LINK_MEMBER_WORKSPACE_MISMATCH: LinkErrors.LINK_MEMBER_WORKSPACE_MISMATCH,
    LINK_DEFAULT_PROJECT_NOT_FOUND: LinkErrors.LINK_DEFAULT_PROJECT_NOT_FOUND,
    LINK_PROJECT_DELETED: LinkErrors.LINK_PROJECT_DELETED,
    LINK_CREATE_FAILED: LinkErrors.LINK_CREATE_FAILED,
  })
  .input(CreateLinkSchema)
  .output(ApiResponseSchema(LinkCreateDataSchema));

/**
 * GET /workspace/{workspaceId}/links/{linkId}
 * Get link details by ID
 */
export const getLinkById = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}/links/{linkId}',
    inputStructure: 'detailed',
    summary: 'Get link by ID',
    description: 'Retrieve complete link details including project and creator info',
    tags: ['Links'],
  })
  .errors({
    LINK_NOT_FOUND: LinkErrors.LINK_NOT_FOUND,
    LINK_GONE: LinkErrors.LINK_GONE,
    LINK_WORKSPACE_MISMATCH: LinkErrors.LINK_WORKSPACE_MISMATCH,
  })
  .input(LinkByIdSchema)
  .output(ApiResponseSchema(LinkGetDataSchema));

/**
 * PUT /workspace/{workspaceId}/links/{linkId}
 * Update a link
 */
export const updateLink = oc
  .route({
    method: 'PUT',
    path: '/workspace/{workspaceId}/links/{linkId}',
    inputStructure: 'detailed',
    summary: 'Update link',
    description: 'Update link properties',
    tags: ['Links'],
  })
  .errors({
    LINK_NOT_FOUND: LinkErrors.LINK_NOT_FOUND,
    LINK_GONE: LinkErrors.LINK_GONE,
    LINK_WORKSPACE_MISMATCH: LinkErrors.LINK_WORKSPACE_MISMATCH,
    LINK_UPDATE_FAILED: LinkErrors.LINK_UPDATE_FAILED,
  })
  .input(UpdateLinkSchema)
  .output(ApiResponseSchema(LinkUpdateDataSchema));

/**
 * DELETE /workspace/{workspaceId}/links/{linkId}
 * Delete a link
 */
export const deleteLink = oc
  .route({
    method: 'DELETE',
    path: '/workspace/{workspaceId}/links/{linkId}',
    inputStructure: 'detailed',
    summary: 'Delete link',
    description: 'Soft delete a recording link',
    tags: ['Links'],
  })
  .errors({
    LINK_NOT_FOUND: LinkErrors.LINK_NOT_FOUND,
    LINK_GONE: LinkErrors.LINK_GONE,
    LINK_WORKSPACE_MISMATCH: LinkErrors.LINK_WORKSPACE_MISMATCH,
    LINK_DELETE_FAILED: LinkErrors.LINK_DELETE_FAILED,
  })
  .input(DeleteLinkSchema)
  .output(ApiResponseSchema(LinkDeleteDataSchema));
