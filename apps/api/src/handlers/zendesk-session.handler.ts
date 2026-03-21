/**
 * Zendesk session endpoint
 * Exchanges a ZAF-signed JWT for a short-lived session JWT
 *
 * Flow:
 * 1. Zendesk iframe calls client.request() with ZAF JWT (signed by proxy with HS256)
 * 2. This endpoint verifies the ZAF JWT using the shared ZENDESK_JWT_SECRET
 * 3. Rate limits by workspace (after verification, since ZAF proxy shares IPs)
 * 4. Looks up the integration to get integrationId
 * 5. Returns a short-lived session JWT (15 min) for subsequent ORPC calls
 */

import type { Context } from 'hono';

import type { RateLimiter } from '@userplane/cache';

import { createLogger } from '@/api/lib/logger';
import { signSessionJwt, verifyZafJwt } from '@/api/lib/zendesk-jwt';
import type { IntegrationRepository } from '@/api/repositories/integrations.repository';

const logger = createLogger('zendesk-session');

interface ZendeskSessionHandlerDeps {
  jwtSecret: string;
  integrationRepo: IntegrationRepository;
  rateLimiter: RateLimiter;
}

export function createZendeskSessionHandler(deps: ZendeskSessionHandlerDeps) {
  return async (c: Context) => {
    // 1. Extract Bearer token from Authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid Authorization header' }, 401);
    }

    const zafToken = authHeader.slice(7);
    if (!zafToken) {
      return c.json({ error: 'Missing token' }, 401);
    }

    // 2. Verify the ZAF-signed JWT (cheap, no DB call)
    const claims = verifyZafJwt(zafToken, deps.jwtSecret);
    if (!claims) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    // 3. Rate limit by workspace (after JWT verification so we have identity)
    // Using session tier (30 req/min) — the iframe only calls this on load + every 12 min
    if (deps.rateLimiter.isAvailable()) {
      const result = await deps.rateLimiter.check(
        'session',
        `zendesk-session:${claims.workspaceId}`
      );
      if (!result.success) {
        return c.json({ error: 'Rate limit exceeded', retryAfter: result.retryAfter }, 429);
      }
    }

    // 4. Verify the integration exists and is active
    const integration = await deps.integrationRepo.findByProviderWorkspaceId(
      'zendesk',
      claims.subdomain
    );

    if (!integration) {
      logger.warn({ subdomain: claims.subdomain }, 'Integration not found for session request');
      return c.json({ error: 'Integration not found' }, 404);
    }

    // Verify workspace matches
    if (integration.workspaceId !== claims.workspaceId) {
      logger.warn(
        { claimed: claims.workspaceId, actual: integration.workspaceId },
        'Workspace mismatch in session request'
      );
      return c.json({ error: 'Workspace mismatch' }, 403);
    }

    // 5. Sign and return a short-lived session JWT
    const sessionToken = signSessionJwt(
      {
        workspaceId: integration.workspaceId,
        integrationId: integration.id,
        subdomain: claims.subdomain,
      },
      deps.jwtSecret
    );

    logger.debug(
      { workspaceId: integration.workspaceId, subdomain: claims.subdomain },
      'Zendesk session created'
    );

    return c.json({ token: sessionToken });
  };
}
