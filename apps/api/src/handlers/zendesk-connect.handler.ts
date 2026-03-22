/**
 * Zendesk Connect handlers
 * Endpoints for the connect flow where users connect Zendesk from the iframe app.
 *
 * POST /api/v1/zendesk/connect - Authenticated, starts the connect OAuth flow
 * POST /api/v1/zendesk/connect/complete - Authenticated, completes the connect OAuth flow
 */

import type { Context } from 'hono';

import { auth } from '@/api/clients/auth';
import { createLogger } from '@/api/lib/logger';
import type { ZendeskConnectService } from '@/api/services/zendesk-connect.service';

const logger = createLogger('zendesk-connect-handler');

/**
 * Extract authenticated userId from Better Auth session cookies.
 * Returns null if not authenticated.
 */
async function getSessionUserId(c: Context): Promise<string | null> {
  const sessionData = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  return sessionData?.user?.id ?? null;
}

/**
 * POST /api/v1/zendesk/connect
 * Starts the Zendesk connect OAuth flow. Called from the dashboard authorize page.
 * Authenticated via Better Auth session cookies.
 */
export function createConnectInitiateHandler(service: ZendeskConnectService) {
  return async (c: Context) => {
    try {
      const userId = await getSessionUserId(c);
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const body = await c.req.json();
      const { workspaceId, workspaceUrl, subdomain, installationId } = body;

      if (!subdomain) {
        return c.json({ error: 'Missing required parameters' }, 400);
      }

      const result = await service.initiate({
        userId,
        workspaceId,
        workspaceUrl,
        subdomain,
        installationId: installationId ? Number(installationId) : undefined,
      });

      return c.json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initiate OAuth';
      logger.error({ error }, 'Connect initiation failed');
      return c.json({ error: message }, 400);
    }
  };
}

/**
 * POST /api/v1/zendesk/connect/complete
 * Completes the Zendesk connect OAuth flow after Zendesk OAuth callback.
 * Called from the dashboard callback page.
 * Authenticated via Better Auth session cookies.
 */
export function createConnectCompleteHandler(service: ZendeskConnectService) {
  return async (c: Context) => {
    try {
      const userId = await getSessionUserId(c);
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const body = await c.req.json();
      const { zendeskCode, zendeskState } = body;

      if (!zendeskCode || !zendeskState) {
        return c.json({ error: 'Missing required parameters' }, 400);
      }

      const result = await service.complete({
        zendeskCode,
        zendeskState,
        userId,
      });

      return c.json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete OAuth';
      logger.error({ error }, 'Connect completion failed');
      return c.json({ error: message }, 400);
    }
  };
}
