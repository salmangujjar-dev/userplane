/**
 * Zendesk App OAuth handlers
 * Endpoints for the app OAuth flow where Zendesk's built-in OAuth is used.
 *
 * POST /api/v1/zendesk/app/authorize - Starts the app OAuth flow
 * POST /api/v1/zendesk/app/token - Completes the app OAuth flow
 */

import { ORPCError } from '@orpc/server';
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { auth } from '@/api/clients/auth';
import { createLogger } from '@/api/lib/logger';
import type { ZendeskAppOAuthService } from '@/api/services/zendesk-app-oauth.service';

const logger = createLogger('zendesk-app-oauth-handler');

function getErrorResponse(
  error: unknown,
  fallback: string
): { message: string; status: ContentfulStatusCode } {
  if (error instanceof ORPCError) {
    return { message: error.message, status: error.status as ContentfulStatusCode };
  }

  return {
    message: error instanceof Error ? error.message : fallback,
    status: 400,
  };
}

async function getSessionUserId(c: Context): Promise<string | null> {
  const sessionData = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  return sessionData?.user?.id ?? null;
}

/**
 * POST /api/v1/zendesk/app/authorize
 * Starts the Zendesk app OAuth flow.
 */
export function createAppOAuthInitiateHandler(service: ZendeskAppOAuthService) {
  return async (c: Context) => {
    try {
      const userId = await getSessionUserId(c);
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const body = await c.req.json();
      const { workspaceId, subdomain, installationId, appRedirectUri, appState, appClientId } =
        body;

      if (!subdomain || !workspaceId || !appRedirectUri || !appState || !appClientId) {
        return c.json({ error: 'Missing required parameters' }, 400);
      }

      const result = await service.initiate({
        userId,
        workspaceId,
        subdomain,
        installationId: installationId ? Number(installationId) : undefined,
        appRedirectUri,
        appState,
        appClientId,
      });

      return c.json({ success: true, data: result });
    } catch (error) {
      const { message, status } = getErrorResponse(error, 'Failed to initiate OAuth');
      logger.error({ error }, 'App OAuth initiation failed');
      return c.json({ error: message }, status);
    }
  };
}

/**
 * POST /api/v1/zendesk/app/token
 * Completes the Zendesk app OAuth flow after Zendesk OAuth callback.
 */
export function createAppOAuthCompleteHandler(service: ZendeskAppOAuthService) {
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
      const { message, status } = getErrorResponse(error, 'Failed to complete OAuth');
      logger.error({ error }, 'App OAuth completion failed');
      return c.json({ error: message }, status);
    }
  };
}
