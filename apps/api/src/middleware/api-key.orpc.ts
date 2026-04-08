/**
 * API key authentication middleware for oRPC procedures
 * Verifies Unkey API keys, checks workspace membership, and sets context.
 *
 * Follows the zendesk-app.orpc.ts pattern: custom auth via Authorization header,
 * workspace context from membership lookup, delegates to existing service layer.
 */

import { ORPCError } from '@orpc/server';
import type { WorkspaceRole } from '@userplane/contract';

import { createLogger } from '@/api/lib/logger';
import type { ApiKeyService } from '@/api/services/api-key.service';
import type { WorkspaceService } from '@/api/services/workspace.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';

import type { InitialContext } from './auth.orpc';
import { base } from './auth.orpc';

const logger = createLogger('api-key-auth');

/** Context for user-scoped endpoints (no workspace) */
export type ApiKeyUserContext = InitialContext & {
  userId: string;
  keyId: string;
};

/** Context for workspace-scoped endpoints */
export type ApiKeyContext = InitialContext & {
  userId: string;
  workspaceMemberId: string;
  workspaceId: string;
  workspaceRole: WorkspaceRole;
  keyId: string;
};

/**
 * Create API key authentication + workspace authorization middleware.
 *
 * 1. Reads Authorization: Bearer <key> header
 * 2. Verifies key via Unkey (auth + rate limit + expiry + disabled)
 * 3. Extracts userId from externalId
 * 4. Verifies workspace membership
 * 5. Sets ApiKeyContext
 */
export function createApiKeyAuthMiddleware(deps: {
  apiKeyService: ApiKeyService;
  workspaceMemberService: WorkspaceMemberService;
  workspaceService: WorkspaceService;
}) {
  return base.middleware(async ({ context, next }, input: { workspaceId: string }) => {
    // 1. Extract Bearer token
    const authHeader = context.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ORPCError('UNAUTHORIZED', {
        status: 401,
        message: 'API key required. Use Authorization: Bearer <key>',
      });
    }

    const apiKey = authHeader.slice(7);
    if (!apiKey) {
      throw new ORPCError('UNAUTHORIZED', {
        status: 401,
        message: 'API key required. Use Authorization: Bearer <key>',
      });
    }

    // 2. Verify with Unkey (includes rate limit + expiry check)
    const result = await deps.apiKeyService.verifyKey(apiKey);

    if (!result.valid) {
      switch (result.code) {
        case 'RATE_LIMITED':
          throw new ORPCError('TOO_MANY_REQUESTS', {
            status: 429,
            message: 'Rate limit exceeded. Please try again later.',
          });
        case 'EXPIRED':
          throw new ORPCError('UNAUTHORIZED', {
            status: 401,
            message: 'API key has expired.',
          });
        case 'DISABLED':
          throw new ORPCError('FORBIDDEN', {
            status: 403,
            message: 'API key is disabled.',
          });
        case 'SERVICE_ERROR':
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            status: 503,
            message: 'API key verification service unavailable. Please try again later.',
          });
        default:
          throw new ORPCError('UNAUTHORIZED', {
            status: 401,
            message: 'Invalid API key.',
          });
      }
    }

    if (!result.keyId) {
      logger.error({ code: result.code }, 'Verified key has no keyId');
      throw new ORPCError('UNAUTHORIZED', {
        status: 401,
        message: 'Invalid API key.',
      });
    }

    // 3. Extract userId from externalId
    const userId = result.externalId;
    if (!userId) {
      logger.error({ keyId: result.keyId }, 'API key has no externalId');
      throw new ORPCError('UNAUTHORIZED', {
        status: 401,
        message: 'Invalid API key.',
      });
    }

    // 4. Validate workspaceId and check membership
    const workspaceId = input.workspaceId;
    if (!workspaceId) {
      throw new ORPCError('BAD_REQUEST', {
        status: 400,
        message: 'Workspace ID is required.',
      });
    }

    // Verify workspace exists
    const workspace = await deps.workspaceService.getById(workspaceId);

    // Verify user is an active member (uses cached lookup)
    const member = await deps.workspaceMemberService.getMembershipForAuth(
      userId,
      workspace.workspaceId
    );

    if (!member) {
      throw new ORPCError('FORBIDDEN', {
        status: 403,
        message: 'Not a member of this workspace.',
      });
    }

    // 5. Set context
    return next({
      context: {
        userId,
        workspaceMemberId: member.workspaceMemberId,
        workspaceId: workspace.workspaceId,
        workspaceRole: member.workspaceRole,
        keyId: result.keyId,
      },
    });
  });
}

/**
 * API key authentication middleware for user-scoped endpoints (no workspace check).
 * Used for endpoints like "list my workspaces" where no workspaceId is in the path.
 */
export function createApiKeyUserAuthMiddleware(deps: { apiKeyService: ApiKeyService }) {
  return base.middleware(async ({ context, next }) => {
    const authHeader = context.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ORPCError('UNAUTHORIZED', {
        status: 401,
        message: 'API key required. Use Authorization: Bearer <key>',
      });
    }

    const apiKey = authHeader.slice(7);
    if (!apiKey) {
      throw new ORPCError('UNAUTHORIZED', {
        status: 401,
        message: 'API key required. Use Authorization: Bearer <key>',
      });
    }

    const result = await deps.apiKeyService.verifyKey(apiKey);

    if (!result.valid) {
      switch (result.code) {
        case 'RATE_LIMITED':
          throw new ORPCError('TOO_MANY_REQUESTS', {
            status: 429,
            message: 'Rate limit exceeded. Please try again later.',
          });
        case 'EXPIRED':
          throw new ORPCError('UNAUTHORIZED', { status: 401, message: 'API key has expired.' });
        case 'DISABLED':
          throw new ORPCError('FORBIDDEN', { status: 403, message: 'API key is disabled.' });
        case 'SERVICE_ERROR':
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            status: 503,
            message: 'API key verification service unavailable. Please try again later.',
          });
        default:
          throw new ORPCError('UNAUTHORIZED', { status: 401, message: 'Invalid API key.' });
      }
    }

    if (!result.keyId) {
      throw new ORPCError('UNAUTHORIZED', { status: 401, message: 'Invalid API key.' });
    }

    const userId = result.externalId;
    if (!userId) {
      throw new ORPCError('UNAUTHORIZED', { status: 401, message: 'Invalid API key.' });
    }

    return next({
      context: { userId, keyId: result.keyId },
    });
  });
}
