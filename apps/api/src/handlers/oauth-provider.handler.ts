/**
 * OAuth Provider handlers
 * Endpoints for Zendesk app OAuth where Userplane is the OAuth provider.
 *
 * POST /api/v1/oauth/zendesk/initiate - Authenticated, starts the OAuth flow
 * POST /api/v1/oauth/zendesk/complete - Authenticated, completes the OAuth flow
 */

import type { Context } from 'hono';

import { auth } from '@/api/clients/auth';
import { createLogger } from '@/api/lib/logger';
import type { OAuthProviderService } from '@/api/services/oauth-provider.service';

const logger = createLogger('oauth-provider-handler');

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
 * POST /api/v1/oauth/zendesk/initiate
 * Starts the nested OAuth flow. Called from the dashboard authorize page.
 * Authenticated via Better Auth session cookies.
 */
export function createOAuthInitiateHandler(service: OAuthProviderService) {
  return async (c: Context) => {
    try {
      const userId = await getSessionUserId(c);
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const body = await c.req.json();
      const { workspaceId, subdomain, mode, outerRedirectUri, outerState, outerClientId } = body;

      if (!workspaceId || !subdomain) {
        return c.json({ error: 'Missing required parameters' }, 400);
      }

      // In OAuth mode (built-in), outer params are required
      if (mode !== 'popup' && (!outerRedirectUri || !outerState || !outerClientId)) {
        return c.json({ error: 'Missing required OAuth parameters' }, 400);
      }

      const result = await service.initiatePendingAuth({
        userId,
        workspaceId,
        subdomain,
        mode: mode === 'popup' ? 'popup' : 'oauth',
        outerRedirectUri,
        outerState,
        outerClientId,
      });

      return c.json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initiate OAuth';
      logger.error({ error }, 'OAuth initiation failed');
      return c.json({ error: message }, 400);
    }
  };
}

/**
 * POST /api/v1/oauth/zendesk/complete
 * Completes the nested OAuth flow after Zendesk OAuth callback.
 * Called from the dashboard callback page.
 * Authenticated via Better Auth session cookies.
 */
export function createOAuthCompleteHandler(service: OAuthProviderService) {
  return async (c: Context) => {
    try {
      const userId = await getSessionUserId(c);
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const body = await c.req.json();
      const { innerCode, innerState } = body;

      if (!innerCode || !innerState) {
        return c.json({ error: 'Missing required parameters' }, 400);
      }

      const result = await service.completePendingAuth({
        innerCode,
        innerState,
        userId,
      });

      return c.json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete OAuth';
      logger.error({ error }, 'OAuth completion failed');
      return c.json({ error: message }, 400);
    }
  };
}
