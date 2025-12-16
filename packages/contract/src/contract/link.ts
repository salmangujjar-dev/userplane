import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  ListLinksQuerySchema,
  LinksListDataSchema,
  CreateLinkSchema,
  LinkCreateDataSchema,
  UpdateLinkSchema,
  LinkUpdateDataSchema,
  LinkGetDataSchema,
  LinkDeleteDataSchema,
  ApiResponseSchema,
} from '../schemas';

/**
 * Link contract
 * Endpoints for recording link operations
 */

/**
 * GET /api/v1/workspace/:workspaceId/links
 * List links with pagination and filtering
 */
export const getLinks = oc
  .route({
    method: 'GET',
    path: '/api/v1/workspace/:workspaceId/links',
    summary: 'List links',
    description: 'Retrieve paginated list of recording links with optional filters',
    tags: ['Links'],
  })
  .input(ListLinksQuerySchema)
  .output(ApiResponseSchema(LinksListDataSchema));

/**
 * POST /api/v1/workspace/:workspaceId/links
 * Create a new recording link
 */
export const createLink = oc
  .route({
    method: 'POST',
    path: '/api/v1/workspace/:workspaceId/links',
    summary: 'Create link',
    description: 'Create a new recording link for a domain',
    tags: ['Links'],
  })
  .input(CreateLinkSchema)
  .output(ApiResponseSchema(LinkCreateDataSchema));

/**
 * GET /api/v1/workspace/:workspaceId/links/:linkId
 * Get link details by ID
 */
export const getLinkById = oc
  .route({
    method: 'GET',
    path: '/api/v1/workspace/:workspaceId/links/:linkId',
    summary: 'Get link by ID',
    description: 'Retrieve complete link details including project and creator info',
    tags: ['Links'],
  })
  .output(ApiResponseSchema(LinkGetDataSchema));

/**
 * PUT /api/v1/workspace/:workspaceId/links/:linkId
 * Update a link
 */
export const updateLink = oc
  .route({
    method: 'PUT',
    path: '/api/v1/workspace/:workspaceId/links/:linkId',
    summary: 'Update link',
    description: 'Update link properties',
    tags: ['Links'],
  })
  .input(UpdateLinkSchema)
  .output(ApiResponseSchema(LinkUpdateDataSchema));

/**
 * DELETE /api/v1/workspace/:workspaceId/links/:linkId
 * Delete a link
 */
export const deleteLink = oc
  .route({
    method: 'DELETE',
    path: '/api/v1/workspace/:workspaceId/links/:linkId',
    summary: 'Delete link',
    description: 'Soft delete a recording link',
    tags: ['Links'],
  })
  .output(ApiResponseSchema(LinkDeleteDataSchema));
