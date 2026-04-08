/**
 * API key management contract
 * Session-authenticated endpoints for managing personal API keys.
 * These are dashboard-facing routes (not public API routes).
 */

import { oc } from '@orpc/contract';

import { ApiResponseSchema } from '../schemas';
import { ApiKeyErrors } from './errors';
import {
  ApiKeyByIdSchema,
  ApiKeyCreateDataSchema,
  ApiKeyDeleteDataSchema,
  ApiKeyListDataSchema,
  ApiKeyRotateSchema,
  CreateApiKeySchema,
} from './schemas';

// =============================================================================
// API Key Management
// =============================================================================

/**
 * POST /account/api-key
 * Create a personal API key (up to MAX_KEYS_PER_USER)
 */
export const createApiKey = oc
  .route({
    method: 'POST',
    path: '/account/api-key',
    inputStructure: 'detailed',
    summary: 'Create API key',
    description: 'Create a personal API key.',
    tags: ['API Keys'],
  })
  .errors({
    UNAUTHORIZED: ApiKeyErrors.UNAUTHORIZED,
    API_KEY_ALREADY_EXISTS: ApiKeyErrors.API_KEY_ALREADY_EXISTS,
    API_KEY_CREATE_FAILED: ApiKeyErrors.API_KEY_CREATE_FAILED,
  })
  .input(CreateApiKeySchema)
  .output(ApiResponseSchema(ApiKeyCreateDataSchema));

/**
 * GET /account/api-key
 * List current user's API keys (masked)
 */
export const listApiKeys = oc
  .route({
    method: 'GET',
    path: '/account/api-key',
    summary: 'List API keys',
    description: "List the current user's API keys with masked key values.",
    tags: ['API Keys'],
  })
  .errors({
    UNAUTHORIZED: ApiKeyErrors.UNAUTHORIZED,
  })
  .output(ApiResponseSchema(ApiKeyListDataSchema));

/**
 * DELETE /account/api-key/{keyId}
 * Revoke a specific API key
 */
export const deleteApiKey = oc
  .route({
    method: 'DELETE',
    path: '/account/api-key/{keyId}',
    inputStructure: 'detailed',
    summary: 'Revoke API key',
    description: 'Permanently revoke a specific API key.',
    tags: ['API Keys'],
  })
  .errors({
    UNAUTHORIZED: ApiKeyErrors.UNAUTHORIZED,
    API_KEY_NOT_FOUND: ApiKeyErrors.API_KEY_NOT_FOUND,
    API_KEY_REVOKE_FAILED: ApiKeyErrors.API_KEY_REVOKE_FAILED,
  })
  .input(ApiKeyByIdSchema)
  .output(ApiResponseSchema(ApiKeyDeleteDataSchema));

/**
 * POST /account/api-key/{keyId}/rotate
 * Rotate a specific API key (revoke + create new)
 */
export const rotateApiKey = oc
  .route({
    method: 'POST',
    path: '/account/api-key/{keyId}/rotate',
    inputStructure: 'detailed',
    summary: 'Rotate API key',
    description: 'Revoke a specific API key and create a new one.',
    tags: ['API Keys'],
  })
  .errors({
    UNAUTHORIZED: ApiKeyErrors.UNAUTHORIZED,
    API_KEY_NOT_FOUND: ApiKeyErrors.API_KEY_NOT_FOUND,
    API_KEY_ROTATE_FAILED: ApiKeyErrors.API_KEY_ROTATE_FAILED,
  })
  .input(ApiKeyRotateSchema)
  .output(ApiResponseSchema(ApiKeyCreateDataSchema));
