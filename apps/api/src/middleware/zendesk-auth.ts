/**
 * Zendesk iframe app authentication middleware
 * Verifies the apiToken from Zendesk app secure parameters
 * The apiToken is generated during OAuth and stored in the integration record
 */

import type { Context, Next } from 'hono';

import { createLogger } from '@/api/lib/logger';
import type { IntegrationRepository } from '@/api/repositories/integrations.repository';

const logger = createLogger('zendesk-auth');

export interface ZendeskAuthDeps {
  integrationRepo: IntegrationRepository;
}

/**
 * Create Zendesk API token authentication middleware
 * Reads Bearer token from Authorization header, looks up integration by apiToken,
 * and attaches workspaceId to the request context
 */
export function createZendeskAuthMiddleware(deps: ZendeskAuthDeps) {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid Authorization header' }, 401);
    }

    const apiToken = authHeader.slice(7);
    if (!apiToken) {
      return c.json({ error: 'Missing API token' }, 401);
    }

    // Look up integration by provider and find the one with matching apiToken
    // This iterates through zendesk integrations to find the matching one
    const integration = await deps.integrationRepo.findByApiToken('zendesk', apiToken);

    if (!integration) {
      logger.warn('Invalid API token - no matching integration found');
      return c.json({ error: 'Invalid API token' }, 401);
    }

    // Attach workspace context for downstream handlers
    c.set('workspaceId', integration.workspaceId);
    c.set('integrationId', integration.id);
    c.set('subdomain', (integration.providerMeta as { subdomain: string }).subdomain);

    await next();
  };
}
