/**
 * Zendesk app Hono handlers
 * Only the resolve endpoint remains as a Hono route (internal API key auth).
 * All other endpoints are now ORPC routes in routes/zendesk-app/zendesk-app.impl.ts
 */

import type { Context } from 'hono';

import { env } from '@/api/env';
import { createLogger } from '@/api/lib/logger';
import type { IntegrationRepository } from '@/api/repositories/integrations.repository';

const logger = createLogger('zendesk-app-handler');

/**
 * GET /api/v1/zendesk/resolve?subdomain=X - Resolve integration config by subdomain
 * Called server-to-server from the dashboard (Next.js server component).
 * Secured via X-Internal-Key header.
 */
export function createResolveHandler(deps: { integrationRepo: IntegrationRepository }) {
  return async (c: Context) => {
    // Verify internal API key
    const internalKey = c.req.header('X-Internal-Key');
    if (!internalKey || internalKey !== env.server.internalApiKey) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const subdomain = c.req.query('subdomain');
    if (!subdomain) {
      return c.json({ error: 'Missing subdomain parameter' }, 400);
    }

    try {
      const integration = await deps.integrationRepo.findByProviderWorkspaceId(
        'zendesk',
        subdomain
      );

      if (!integration) {
        return c.json({ connected: false, subdomain });
      }

      const apiToken = (integration.providerToken as { apiToken?: string })?.apiToken;
      if (!apiToken) {
        return c.json({ connected: false, subdomain });
      }

      return c.json({
        connected: true,
        apiToken,
        workspaceId: integration.workspaceId,
        subdomain,
      });
    } catch (err) {
      logger.error({ err, subdomain }, 'Failed to resolve integration');
      return c.json({ connected: false, subdomain });
    }
  };
}
