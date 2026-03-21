/**
 * Zendesk App oRPC middleware
 * Authentication (session JWT verification) and rate limiting for Zendesk iframe endpoints
 */

import { ORPCError } from '@orpc/server';
import type { RateLimiter } from '@userplane/cache';
import { zendeskAppError } from '@userplane/contract';

import { createLogger } from '@/api/lib/logger';
import { verifySessionJwt } from '@/api/lib/zendesk-jwt';

import type { InitialContext } from './auth.orpc';
import { base } from './auth.orpc';

const logger = createLogger('zendesk-app-auth');

export type ZendeskAppContext = InitialContext & {
  workspaceId: string;
  integrationId: string;
  subdomain: string;
};

/**
 * Create Zendesk app session JWT authentication middleware
 * Verifies short-lived session JWTs (signed by our session endpoint)
 * Stateless — no database lookup required
 */
export function createZendeskAppAuthMiddleware(deps: { jwtSecret: string }) {
  return base.middleware(async ({ context, next }) => {
    const authHeader = context.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw zendeskAppError.ZENDESK_APP_UNAUTHORIZED();
    }

    const token = authHeader.slice(7);
    if (!token) {
      throw zendeskAppError.ZENDESK_APP_UNAUTHORIZED();
    }

    const payload = verifySessionJwt(token, deps.jwtSecret);

    if (!payload) {
      logger.warn('Invalid or expired session JWT');
      throw zendeskAppError.ZENDESK_APP_UNAUTHORIZED();
    }

    return next({
      context: {
        workspaceId: payload.workspaceId,
        integrationId: payload.integrationId,
        subdomain: payload.subdomain,
      },
    });
  });
}

/**
 * Create rate limiting middleware for Zendesk app routes
 * Uses webhook tier (1000 req/min) keyed by workspace ID
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
