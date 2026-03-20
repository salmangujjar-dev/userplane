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
export function getAuthorizationUrl(subdomain: string, state: string): string {
  const validatedSubdomain = validateSubdomain(subdomain);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.zendesk.clientId,
    redirect_uri: env.zendesk.redirectUri,
    scope: 'read tickets:write',
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
