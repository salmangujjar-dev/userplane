/**
 * Zendesk App oRPC middleware
 * Authentication (Bearer token) and rate limiting for Zendesk iframe endpoints
 */

import type { RateLimiter } from '@userplane/cache';
import { ORPCError } from '@orpc/server';
import { zendeskAppError } from '@userplane/contract';

import { createLogger } from '@/api/lib/logger';
import type { IntegrationRepository } from '@/api/repositories/integrations.repository';

import type { InitialContext } from './auth.orpc';
import { base } from './auth.orpc';

const logger = createLogger('zendesk-app-auth');

export type ZendeskAppContext = InitialContext & {
  workspaceId: string;
  integrationId: string;
  subdomain: string;
};

/**
 * Create Zendesk app Bearer token authentication middleware
 * Reads Authorization header, validates apiToken, attaches workspace context
 */
export function createZendeskAppAuthMiddleware(deps: { integrationRepo: IntegrationRepository }) {
  return base.middleware(async ({ context, next }) => {
    const authHeader = context.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw zendeskAppError.ZENDESK_APP_UNAUTHORIZED();
    }

    const apiToken = authHeader.slice(7);
    if (!apiToken) {
      throw zendeskAppError.ZENDESK_APP_UNAUTHORIZED();
    }

    const integration = await deps.integrationRepo.findByApiToken('zendesk', apiToken);

    if (!integration) {
      logger.warn('Invalid API token - no matching integration found');
      throw zendeskAppError.ZENDESK_APP_UNAUTHORIZED();
    }

    return next({
      context: {
        workspaceId: integration.workspaceId,
        integrationId: integration.id,
        subdomain: (integration.providerMeta as { subdomain: string }).subdomain,
      },
    });
  });
}

/**
 * Create rate limiting middleware for Zendesk app routes
 * Uses webhook tier (1000 req/min) keyed by workspace ID — matches the old Hono behavior
 */
export function createZendeskAppRateLimitMiddleware(limiter: RateLimiter) {
  return base.$context<ZendeskAppContext>().middleware(async ({ context, next }) => {
    if (!limiter.isAvailable()) {
      return next({});
    }

    const result = await limiter.check('webhook', `zendesk:${context.workspaceId}`);

    if (!result.success) {
      throw new ORPCError('RATE_LIMIT_EXCEEDED', {
        status: 429,
        message: 'Rate limit exceeded. Please try again later.',
        data: { retryAfter: result.retryAfter },
      });
    }

    return next({});
  });
}
