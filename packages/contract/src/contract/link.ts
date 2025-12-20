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
  .input(DeleteLinkSchema)
  .output(ApiResponseSchema(LinkDeleteDataSchema));
