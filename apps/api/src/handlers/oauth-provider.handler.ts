/**
 * OAuth Provider handlers
 * Endpoints for Zendesk built-in app OAuth where Userplane is the OAuth provider.
 *
 * POST /api/v1/oauth/token - Public token exchange (called by Zendesk backend)
 * POST /api/v1/oauth/zendesk/initiate - Authenticated, starts the nested OAuth flow
 * POST /api/v1/oauth/zendesk/complete - Authenticated, completes the nested OAuth flow
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
 * POST /api/v1/oauth/token
 * OAuth 2.0 token exchange endpoint. Called by Zendesk's backend
 * with application/x-www-form-urlencoded body.
 */
export function createOAuthTokenHandler(service: OAuthProviderService) {
  return async (c: Context) => {
    try {
      const contentType = c.req.header('Content-Type') ?? '';
      let grantType: string;
      let code: string;
      let clientId: string;
      let clientSecret: string;

      if (contentType.includes('application/x-www-form-urlencoded')) {
        const body = await c.req.parseBody();
        grantType = body.grant_type as string;
        code = body.code as string;
        clientId = body.client_id as string;
        clientSecret = body.client_secret as string;
      } else {
        const body = await c.req.json();
        grantType = body.grant_type;
        code = body.code;
        clientId = body.client_id;
        clientSecret = body.client_secret;
      }

      if (grantType !== 'authorization_code') {
        return c.json({ error: 'unsupported_grant_type' }, 400);
      }

      if (!code || !clientId || !clientSecret) {
        return c.json(
          { error: 'invalid_request', error_description: 'Missing required parameters' },
          400
        );
      }

      const result = await service.exchangeAuthCode({ code, clientId, clientSecret });
      return c.json(result);
    } catch (error) {
      logger.error({ error }, 'OAuth token exchange failed');
      return c.json({ error: 'invalid_grant', error_description: 'Token exchange failed' }, 400);
    }
  };
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
      const { workspaceId, subdomain, outerRedirectUri, outerState, outerClientId } = body;

      if (!workspaceId || !subdomain || !outerRedirectUri || !outerState || !outerClientId) {
        return c.json({ error: 'Missing required parameters' }, 400);
      }

      const result = await service.initiatePendingAuth({
        userId,
        workspaceId,
        subdomain,
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
