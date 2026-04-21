/**
 * Zendesk API client
 * Handles OAuth flow and API calls to Zendesk
 */

import { z } from 'zod';

import { env } from '@/api/env';
import { createLogger } from '@/api/lib/logger';
import { captureException } from '@/api/posthog';

const logger = createLogger('zendesk-client');

/** OAuth scopes requested from Zendesk: read all, write tickets + app installations */
const ZENDESK_OAUTH_SCOPES = 'read tickets:write apps:write';
const ZENDESK_ACCESS_TOKEN_EXPIRES_IN_SECONDS = 24 * 60 * 60;
const ZENDESK_REFRESH_TOKEN_EXPIRES_IN_SECONDS = 89 * 24 * 60 * 60;

const zendeskMarketplaceHeaders = {
  'X-Zendesk-Marketplace-Name': env.zendesk.marketplace.name,
  'X-Zendesk-Marketplace-Organization-Id': env.zendesk.marketplace.organizationId,
  'X-Zendesk-Marketplace-App-Id': env.zendesk.marketplace.appId,
} as const;

function withMarketplaceHeaders(headers: Record<string, string> = {}): Record<string, string> {
  return {
    ...zendeskMarketplaceHeaders,
    ...headers,
  };
}

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
const ZendeskTokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  scope: z.string(),
  refresh_token: z.string().optional(),
  expires_in: z.number().optional(),
  refresh_token_expires_in: z.number().optional(),
});

export type ZendeskTokenResponse = z.infer<typeof ZendeskTokenResponseSchema>;

/**
 * Zendesk current user response from /api/v2/users/me.json
 */
const ZendeskMeResponseSchema = z.object({
  user: z.object({
    id: z.number(),
    url: z.string(),
    name: z.string(),
    email: z.string().nullable(),
    role: z.string(),
    active: z.boolean(),
    verified: z.boolean(),
  }),
});

export type ZendeskMeResponse = z.infer<typeof ZendeskMeResponseSchema>;

/**
 * Build Zendesk OAuth authorization URL
 * Zendesk requires subdomain for per-account OAuth endpoints
 */
export function getAuthorizationUrl(
  subdomain: string,
  state: string,
  codeChallenge: string
): string {
  const validatedSubdomain = validateSubdomain(subdomain);
  // Zendesk requires %20 for spaces in scopes (not +) and literal colons
  // for resource-specific scopes (e.g. tickets:write). URLSearchParams
  // encodes spaces as + and colons as %3A, so we build the query manually.
  const params: Record<string, string> = {
    response_type: 'code',
    client_id: env.zendesk.clientId,
    redirect_uri: env.zendesk.redirectUri,
    scope: ZENDESK_OAUTH_SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  };
  const query = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
    .replace(/%3A/gi, ':');

  return `https://${validatedSubdomain}.zendesk.com/oauth/authorizations/new?${query}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  subdomain: string,
  code: string,
  codeVerifier: string
): Promise<ZendeskTokenResponse | null> {
  const validatedSubdomain = validateSubdomain(subdomain);
  try {
    const response = await fetch(`https://${validatedSubdomain}.zendesk.com/oauth/tokens`, {
      method: 'POST',
      headers: withMarketplaceHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: env.zendesk.clientId,
        client_secret: env.zendesk.clientSecret || undefined,
        code_verifier: codeVerifier,
        redirect_uri: env.zendesk.redirectUri,
        scope: ZENDESK_OAUTH_SCOPES,
        expires_in: ZENDESK_ACCESS_TOKEN_EXPIRES_IN_SECONDS,
        refresh_token_expires_in: ZENDESK_REFRESH_TOKEN_EXPIRES_IN_SECONDS,
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

    const data = ZendeskTokenResponseSchema.parse(await response.json());
    return data;
  } catch (error) {
    logger.error({ error }, 'Token exchange error');
    captureException(error, undefined, { operation: 'zendesk_token_exchange' });
    return null;
  }
}

/**
 * Add an internal note or public comment to a Zendesk ticket
 * Returns true on success, false on failure (fire-and-forget)
 */
export async function addTicketComment(
  subdomain: string,
  accessToken: string,
  ticketId: string,
  htmlBody: string,
  isInternal: boolean = true
): Promise<boolean> {
  const validatedSubdomain = validateSubdomain(subdomain);
  try {
    const response = await fetch(
      `https://${validatedSubdomain}.zendesk.com/api/v2/tickets/${ticketId}.json`,
      {
        method: 'PUT',
        headers: withMarketplaceHeaders({
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          ticket: {
            comment: {
              html_body: htmlBody,
              public: !isInternal,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn(
        { status: response.status, error: errorText, subdomain, ticketId },
        'Add ticket comment failed'
      );
      captureException(new Error('failed to add ticket comment to Zendesk'), undefined, {
        operation: 'zendesk_add_ticket_comment',
        status: response.status,
        error_text: errorText,
        subdomain,
        ticket_id: ticketId,
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error({ error, subdomain, ticketId }, 'Add ticket comment error');
    captureException(error, undefined, {
      operation: 'zendesk_add_ticket_comment',
      subdomain,
      ticket_id: ticketId,
    });
    return false;
  }
}

/**
 * Set secure settings on a Zendesk app installation
 * Used during OAuth to configure the jwt_secret for ZAF JWT auth
 */
export async function setInstallationSettings(
  subdomain: string,
  accessToken: string,
  installationId: number,
  settings: Record<string, string>
): Promise<boolean> {
  const validatedSubdomain = validateSubdomain(subdomain);
  try {
    const response = await fetch(
      `https://${validatedSubdomain}.zendesk.com/api/v2/apps/installations/${installationId}.json`,
      {
        method: 'PUT',
        headers: withMarketplaceHeaders({
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ settings }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn(
        { status: response.status, error: errorText, subdomain, installationId },
        'Set installation settings failed'
      );
      captureException(new Error('failed to set Zendesk installation settings'), undefined, {
        operation: 'zendesk_set_installation_settings',
        status: response.status,
        error_text: errorText,
        subdomain,
        installation_id: installationId,
      });
      return false;
    }

    logger.debug({ subdomain, installationId }, 'Zendesk installation settings updated');
    return true;
  } catch (error) {
    logger.error({ error, subdomain, installationId }, 'Set installation settings error');
    captureException(error, undefined, {
      operation: 'zendesk_set_installation_settings',
      subdomain,
      installation_id: installationId,
    });
    return false;
  }
}

export type RefreshResult =
  | { ok: true; data: ZendeskTokenResponse }
  | { ok: false; permanent: boolean };

/**
 * Refresh an expired access token using a refresh token.
 * Returns a discriminated union so callers can distinguish permanent failures
 * (expired/revoked token) from transient ones (network issues, 5xx).
 */
export async function refreshAccessToken(
  subdomain: string,
  refreshToken: string
): Promise<RefreshResult> {
  const validatedSubdomain = validateSubdomain(subdomain);
  try {
    const response = await fetch(`https://${validatedSubdomain}.zendesk.com/oauth/tokens`, {
      method: 'POST',
      headers: withMarketplaceHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: env.zendesk.clientId,
        client_secret: env.zendesk.clientSecret || undefined,
        scope: ZENDESK_OAUTH_SCOPES,
        expires_in: ZENDESK_ACCESS_TOKEN_EXPIRES_IN_SECONDS,
        refresh_token_expires_in: ZENDESK_REFRESH_TOKEN_EXPIRES_IN_SECONDS,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn({ status: response.status, error: errorText }, 'Token refresh failed');
      captureException(new Error('token refresh failed with Zendesk'), undefined, {
        operation: 'zendesk_token_refresh',
        status: response.status,
        error_text: errorText,
      });

      // Determine if this is a permanent failure (expired/revoked token)
      let permanent = false;
      if (response.status === 400 || response.status === 401) {
        try {
          const errorBody = JSON.parse(errorText);
          const errorCode = errorBody.error;
          if (errorCode === 'invalid_grant' || errorCode === 'invalid_token') {
            permanent = true;
          }
        } catch {
          // Could not parse error body — treat as transient
        }
      }

      return { ok: false, permanent };
    }

    const data = ZendeskTokenResponseSchema.parse(await response.json());
    return { ok: true, data };
  } catch (error) {
    logger.error({ error }, 'Token refresh error');
    captureException(error, undefined, { operation: 'zendesk_token_refresh' });
    return { ok: false, permanent: false };
  }
}

/**
 * Zendesk user from /api/v2/users.json
 */
const ZendeskUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().nullable(),
  role: z.string(),
  active: z.boolean(),
});

export type ZendeskUser = z.infer<typeof ZendeskUserSchema>;

/**
 * Zendesk users list response with cursor pagination
 */
const ZendeskUsersResponseSchema = z.object({
  users: z.array(ZendeskUserSchema),
  meta: z.object({
    has_more: z.boolean(),
    after_cursor: z.string().optional(),
  }),
  links: z.object({
    next: z.string().nullable(),
  }),
});

/** Max pages to fetch when listing agents (safety cap) */
const MAX_AGENT_PAGES = 5;

/**
 * List agents and admins from a Zendesk account.
 * Uses cursor pagination, capped at MAX_AGENT_PAGES pages (~500 agents).
 * Returns empty array on any error (graceful degradation).
 */
export async function listAgents(subdomain: string, accessToken: string): Promise<ZendeskUser[]> {
  const validatedSubdomain = validateSubdomain(subdomain);
  const agents: ZendeskUser[] = [];

  try {
    let url: string | null =
      `https://${validatedSubdomain}.zendesk.com/api/v2/users.json?role[]=admin&role[]=agent&page[size]=100`;
    let page = 0;

    while (url && page < MAX_AGENT_PAGES) {
      const response = await fetch(url, {
        headers: withMarketplaceHeaders({
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.warn({ status: response.status, error: errorText, subdomain }, 'List agents failed');
        captureException(new Error('failed to list agents from Zendesk'), undefined, {
          operation: 'zendesk_list_agents',
          status: response.status,
          error_text: errorText,
          subdomain,
        });
        return agents; // Return whatever we've collected so far
      }

      const data = ZendeskUsersResponseSchema.parse(await response.json());

      for (const user of data.users) {
        if (user.active && user.email) {
          agents.push(user);
        }
      }

      url = data.meta.has_more ? data.links.next : null;
      page++;
    }

    return agents;
  } catch (error) {
    logger.error({ error, subdomain }, 'List agents error');
    captureException(error, undefined, { operation: 'zendesk_list_agents', subdomain });
    return [];
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
      headers: withMarketplaceHeaders({
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      }),
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

    const data = ZendeskMeResponseSchema.parse(await response.json());
    return data;
  } catch (error) {
    logger.error({ error, subdomain }, 'Get /me error');
    captureException(error, undefined, { operation: 'zendesk_get_me' });
    return null;
  }
}
