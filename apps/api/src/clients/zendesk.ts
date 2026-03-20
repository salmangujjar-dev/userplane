/**
 * Zendesk API client
 * Handles OAuth flow and API calls to Zendesk
 */

import { z } from 'zod';

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
    scope: 'read tickets:write',
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: env.zendesk.clientId,
        code_verifier: codeVerifier,
        redirect_uri: env.zendesk.redirectUri,
        scope: 'read tickets:write',
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
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: env.zendesk.clientId,
        scope: 'read tickets:write',
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

    const data = ZendeskMeResponseSchema.parse(await response.json());
    return data;
  } catch (error) {
    logger.error({ error, subdomain }, 'Get /me error');
    captureException(error, undefined, { operation: 'zendesk_get_me' });
    return null;
  }
}
