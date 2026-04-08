/**
 * API key management contract implementation using oRPC
 * Session-authenticated endpoints for creating/managing personal API keys.
 */

import { ORPCError } from '@orpc/server';
import { apiKeyError } from '@userplane/contract';

import { createLogger } from '@/api/lib/logger';
import { authorized } from '@/api/middleware/auth.orpc';
import type { ApiKeyService } from '@/api/services/api-key.service';

const KEY_PREFIX = 'up';
const logger = createLogger('api-key-management');

// =============================================================================
// API Key Management Procedure Factory
// =============================================================================

export const createApiKeyManagementProcedures = (apiKeyService: ApiKeyService) => {
  return {
    create: createApiKeyImpl(apiKeyService),
    list: listApiKeysImpl(apiKeyService),
    delete: deleteApiKeyImpl(apiKeyService),
    rotate: rotateApiKeyImpl(apiKeyService),
  };
};

// =============================================================================
// Implementations
// =============================================================================

/**
 * POST /account/api-key — Create a personal API key
 */
const createApiKeyImpl = (apiKeyService: ApiKeyService) =>
  authorized.apiKey.create.handler(async ({ input, context }) => {
    try {
      // Limit is enforced inside createKey (MAX_KEYS_PER_USER)
      const result = await apiKeyService.createKey({
        userId: context.user.id,
        name: input.body.name,
        expiresIn: input.body.expiresIn,
      });

      return {
        message: 'API key created successfully',
        data: {
          key: result.key,
          keyId: result.keyId,
          expiresAt: result.expiresAt ? new Date(result.expiresAt).toISOString() : null,
        },
      };
    } catch (err) {
      if (err instanceof ORPCError) throw err; // Propagate contract errors (e.g. API_KEY_ALREADY_EXISTS)
      logger.error({ err, userId: context.user.id }, 'Failed to create API key');
      throw apiKeyError.API_KEY_CREATE_FAILED();
    }
  });

/**
 * GET /account/api-key — List current user's API keys (masked)
 */
const listApiKeysImpl = (apiKeyService: ApiKeyService) =>
  authorized.apiKey.list.handler(async ({ context }) => {
    const keys = await apiKeyService.listKeysByExternalId(context.user.id);

    return {
      message: 'API keys retrieved successfully',
      data: {
        keys: keys.map((k) => ({
          keyId: k.keyId,
          maskedKey: `${KEY_PREFIX}_${'•'.repeat(8)}${k.start.slice(-4)}`,
          name: k.name ?? null,
          createdAt: k.createdAt ? new Date(k.createdAt).toISOString() : null,
          expiresAt: k.expires ? new Date(k.expires).toISOString() : null,
          enabled: k.enabled,
        })),
      },
    };
  });

/**
 * DELETE /account/api-key/{keyId} — Revoke a specific API key
 */
const deleteApiKeyImpl = (apiKeyService: ApiKeyService) =>
  authorized.apiKey.delete.handler(async ({ input, context }) => {
    // Verify the key belongs to this user
    const keys = await apiKeyService.listKeysByExternalId(context.user.id);
    const target = keys.find((k) => k.keyId === input.params.keyId);
    if (!target) {
      throw apiKeyError.API_KEY_NOT_FOUND();
    }

    try {
      await apiKeyService.revokeKey(input.params.keyId);
    } catch (err) {
      if (err instanceof ORPCError) throw err;
      logger.error(
        { err, userId: context.user.id, keyId: input.params.keyId },
        'Failed to revoke API key'
      );
      throw apiKeyError.API_KEY_REVOKE_FAILED();
    }

    return {
      message: 'API key revoked successfully',
      data: { revoked: true as const },
    };
  });

/**
 * POST /account/api-key/{keyId}/rotate — Rotate a specific API key
 */
const rotateApiKeyImpl = (apiKeyService: ApiKeyService) =>
  authorized.apiKey.rotate.handler(async ({ input, context }) => {
    // Verify the key belongs to this user
    const keys = await apiKeyService.listKeysByExternalId(context.user.id);
    const target = keys.find((k) => k.keyId === input.params.keyId);
    if (!target) {
      throw apiKeyError.API_KEY_NOT_FOUND();
    }

    try {
      // Revoke this specific key, then create a new one
      await apiKeyService.revokeKey(input.params.keyId);
      const result = await apiKeyService.createKey({
        userId: context.user.id,
        name: input.body.name,
        expiresIn: input.body.expiresIn,
      });

      return {
        message: 'API key rotated successfully',
        data: {
          key: result.key,
          keyId: result.keyId,
          expiresAt: result.expiresAt ? new Date(result.expiresAt).toISOString() : null,
        },
      };
    } catch (err) {
      if (err instanceof ORPCError) throw err;
      logger.error(
        { err, userId: context.user.id, keyId: input.params.keyId },
        'Failed to rotate API key'
      );
      throw apiKeyError.API_KEY_ROTATE_FAILED();
    }
  });
