/**
 * Zendesk API client
 * Handles OAuth flow and API calls to Zendesk
 */

import { env } from '@/api/env';
import { createLogger } from '@/api/lib/logger';
import { captureException } from '@/api/posthog';

const logger = createLogger('zendesk-client');

/**
 * Validate and normalize a Zendesk subdomain.
 * Subdomains must be alphanumeric with optional hyphens (not leading/trailing).
 */
function validateSubdomain(subdomain: string): string {
  const cleaned = subdomain.trim().toLowerCase();
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(cleaned)) {
    throw new Error('Invalid Zendesk subdomain');
  }
  return cleaned;
}

/**
 * Zendesk OAuth token response
 */
export interface ZendeskTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

/**
 * Zendesk current user response from /api/v2/users/me.json
 */
export interface ZendeskMeResponse {
  user: {
    id: number;
    url: string;
    name: string;
    email: string;
    role: string;
    active: boolean;
    verified: boolean;
  };
}

/**
 * Build Zendesk OAuth authorization URL
 * Zendesk requires subdomain for per-account OAuth endpoints
 */
export function getAuthorizationUrl(subdomain: string, state: string): string {
  const validatedSubdomain = validateSubdomain(subdomain);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.zendesk.clientId,
    redirect_uri: env.zendesk.redirectUri,
    scope: 'read',
    state,
  });

  return `https://${validatedSubdomain}.zendesk.com/oauth/authorizations/new?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  subdomain: string,
  code: string
): Promise<ZendeskTokenResponse | null> {
  const validatedSubdomain = validateSubdomain(subdomain);
  try {
    const response = await fetch(`https://${validatedSubdomain}.zendesk.com/oauth/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: env.zendesk.clientId,
        client_secret: env.zendesk.clientSecret,
        redirect_uri: env.zendesk.redirectUri,
        scope: 'read',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn({ status: response.status, error: errorText }, 'Token exchange failed');
      captureException(new Error('token exchange failed with Zendesk'), undefined, {
        operation: 'zendesk_token_exchange',
        status: response.status,
        error_text: errorText,
      });
      return null;
    }

    const data = (await response.json()) as ZendeskTokenResponse;
    return data;
  } catch (error) {
    logger.error({ error }, 'Token exchange error');
    captureException(error, undefined, { operation: 'zendesk_token_exchange' });
    return null;
  }
}

/**
 * Get current user info from Zendesk /api/v2/users/me.json
 */
export async function getMe(
  subdomain: string,
  accessToken: string
): Promise<ZendeskMeResponse | null> {
  const validatedSubdomain = validateSubdomain(subdomain);
  try {
    const response = await fetch(`https://${validatedSubdomain}.zendesk.com/api/v2/users/me.json`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn({ status: response.status, error: errorText, subdomain }, 'Get /me failed');
      captureException(new Error('failed to resolve user info from Zendesk'), undefined, {
        operation: 'zendesk_get_me',
        status: response.status,
        error_text: errorText,
        subdomain,
      });
      return null;
    }

    const data = (await response.json()) as ZendeskMeResponse;
    return data;
  } catch (error) {
    logger.error({ error, subdomain }, 'Get /me error');
    captureException(error, undefined, { operation: 'zendesk_get_me' });
    return null;
  }
}
