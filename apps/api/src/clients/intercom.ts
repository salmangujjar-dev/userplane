/**
 * Intercom API client
 * Handles OAuth flow and API calls to Intercom
 */

import type { IntercomRegion } from '@workspace/contract';

import { env } from '@/api/env';
import { createLogger } from '@/api/lib/logger';
import { captureException } from '@/api/posthog';

const logger = createLogger('intercom-client');

/**
 * Intercom API regions and their base URLs
 */
export const INTERCOM_REGIONS: Record<IntercomRegion, string> = {
  US: 'https://api.intercom.io',
  EU: 'https://api.eu.intercom.io',
  AU: 'https://api.au.intercom.io',
} as const;

/**
 * Intercom OAuth token response
 */
export interface IntercomTokenResponse {
  token_type: string;
  access_token: string;
}

/**
 * Intercom /me endpoint response
 */
export interface IntercomMeResponse {
  type: string;
  id: string;
  email: string;
  name?: string;
  email_verified: boolean;
  has_inbox_seat: boolean;
  // app is a workspace on Intercom
  app: {
    // The type of the app.
    type: string;
    // The id of the app. This is the same as the workspace id on Intercom.
    id_code: string;
    // The name of the app.
    name?: string;
    // The created at timestamp of the app.
    created_at: number;
    // The region of the app.
    region: string;
    // The timezone of the app.
    timezone: string;
    // The identity verification status of the app.
    identity_verification: boolean;
  };
  avatar?: {
    type: string;
    image_url?: string;
  };
}

/**
 * Build Intercom OAuth authorization URL
 * Includes redirect_uri to point to generic dispatcher page
 */
export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.intercom.clientId,
    state,
    redirect_uri: env.intercom.redirectUri,
  });

  return `https://app.intercom.com/oauth?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 * Uses POST to https://api.intercom.io/auth/eagle/token
 */
export async function exchangeCodeForToken(code: string): Promise<IntercomTokenResponse | null> {
  try {
    const response = await fetch('https://api.intercom.io/auth/eagle/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: env.intercom.clientId,
        client_secret: env.intercom.clientSecret,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn({ status: response.status, error: errorText }, 'Token exchange failed');
      captureException(new Error('token exchange failed with intercom'), undefined, {
        operation: 'intercom_token_exchange',
        status: response.status,
        error_text: errorText,
      });
      return null;
    }

    const data = (await response.json()) as IntercomTokenResponse;
    return data;
  } catch (error) {
    logger.error({ error }, 'Token exchange error');
    captureException(error, undefined, { operation: 'intercom_token_exchange' });
    return null;
  }
}

/**
 * Get current admin info from Intercom /me endpoint
 */
export async function getMe(
  accessToken: string,
  region: IntercomRegion = 'US'
): Promise<IntercomMeResponse | null> {
  try {
    const baseUrl = INTERCOM_REGIONS[region];
    const response = await fetch(`${baseUrl}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn({ status: response.status, error: errorText, region }, 'Get /me failed');
      captureException(new Error('failed to resolve admin info from Intercom'), undefined, {
        operation: 'intercom_get_me',
        status: response.status,
        error_text: errorText,
        region,
      });
      return null;
    }

    const data = (await response.json()) as IntercomMeResponse;
    return data;
  } catch (error) {
    logger.error({ error, region }, 'Get /me error');
    captureException(error, undefined, { operation: 'intercom_get_me' });
    return null;
  }
}

/**
 * Map AWS region prefixes to IntercomRegion
 * AWS regions: us-* (US), eu-* (EU), ap-* (AU/APAC)
 */
const AWS_REGION_PREFIX_MAP: Array<{ prefix: string; region: IntercomRegion }> = [
  { prefix: 'us-', region: 'US' },
  { prefix: 'eu-', region: 'EU' },
  { prefix: 'ap-', region: 'AU' },
];

/**
 * Extract region from Intercom authorization code
 * Code format after base64 decode: {code}:{aws-region}
 * e.g., "465f4c05c97c4cf98d199d178da176ea:us-east-1"
 * Returns null if region cannot be extracted or is unrecognized
 */
export function extractRegionFromCode(authCode: string): IntercomRegion | null {
  try {
    // Base64 decode the authorization code
    const decoded = Buffer.from(authCode, 'base64').toString('utf-8');
    // Format: {code}:{aws-region}
    const parts = decoded.split(':');
    const awsRegion = parts[1];
    if (parts.length !== 2 || !awsRegion) {
      return null;
    }
    // Match by prefix (e.g., "us-east-1" matches "us-" -> US)
    for (const { prefix, region } of AWS_REGION_PREFIX_MAP) {
      if (awsRegion.startsWith(prefix)) {
        return region;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get admin info with known region (fast path)
 * Used when region is extracted from authorization code
 */
export async function getMeWithRegion(
  accessToken: string,
  region: IntercomRegion
): Promise<{ me: IntercomMeResponse; region: IntercomRegion } | null> {
  const me = await getMe(accessToken, region);
  if (me) {
    return { me, region };
  }
  return null;
}

/**
 * Auto-detect region and get admin info
 * Tries all regions in parallel for faster response
 * Prefers US > EU > AU if multiple succeed (unlikely)
 */
export async function detectRegionAndGetMe(
  accessToken: string
): Promise<{ me: IntercomMeResponse; region: IntercomRegion } | null> {
  const regions: IntercomRegion[] = ['US', 'EU', 'AU'];

  // Run all region checks in parallel
  const results = await Promise.all(
    regions.map(async (region) => {
      const me = await getMe(accessToken, region);
      return me ? { me, region } : null;
    })
  );

  // Return first successful result (priority: US > EU > AU)
  for (const result of results) {
    if (result) {
      return result;
    }
  }

  return null;
}

/**
 * Reply to an Intercom conversation with an admin note
 * Used for posting internal notes (not visible to customers)
 * Returns true on success, false on failure (fire-and-forget)
 */
export async function replyToConversation(
  accessToken: string,
  region: IntercomRegion,
  conversationId: string,
  adminId: string,
  body: string
): Promise<boolean> {
  try {
    const baseUrl = INTERCOM_REGIONS[region];
    const response = await fetch(`${baseUrl}/conversations/${conversationId}/reply`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Intercom-Version': '2.14',
      },
      body: JSON.stringify({
        message_type: 'note',
        type: 'admin',
        admin_id: adminId,
        body,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn(
        { status: response.status, error: errorText, region, conversationId },
        'Reply to conversation failed'
      );
      captureException(new Error('failed to reply to conversation'), undefined, {
        operation: 'intercom_reply_conversation',
        status: response.status,
        error_text: errorText,
        region,
        conversation_id: conversationId,
        admin_id: adminId,
        body,
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error({ error, region, conversationId }, 'Reply to conversation error');
    captureException(error, undefined, {
      operation: 'intercom_reply_conversation',
      region,
      conversation_id: conversationId,
      admin_id: adminId,
      body,
    });
    return false;
  }
}

/**
 * Intercom admin from /admins endpoint
 */
export interface IntercomAdmin {
  type: string;
  id: string;
  email: string;
  name?: string;
  away_mode_enabled: boolean;
  away_mode_reassign: boolean;
  has_inbox_seat: boolean;
  team_ids: number[];
}

/**
 * Intercom /admins endpoint response
 */
export interface IntercomAdminsResponse {
  type: string;
  admins: IntercomAdmin[];
}

/**
 * Proactively update installation health status with Intercom
 * POST to /app_install/status with Intercom-Version 2.2+
 * Returns true on success, false on failure (fire-and-forget)
 *
 * @see https://developers.intercom.com/docs/build-an-integration/learn-more/installation-health-check
 */
export async function updateInstallStatus(
  accessToken: string,
  region: IntercomRegion,
  status: { state: 'HEALTHY' | 'UNHEALTHY' | 'UNKNOWN'; message?: string }
): Promise<boolean> {
  try {
    const baseUrl = INTERCOM_REGIONS[region];
    const response = await fetch(`${baseUrl}/app_install/status`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Intercom-Version': '2.2',
      },
      body: JSON.stringify(status),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn(
        { status: response.status, error: errorText, region },
        'Update install status failed'
      );
      captureException(new Error('failed to update install status'), undefined, {
        operation: 'intercom_update_install_status',
        status: response.status,
        error_text: errorText,
        region,
        status_state: status.state,
        status_message: status.message,
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error({ error, region }, 'Update install status error');
    captureException(error, undefined, {
      operation: 'intercom_update_install_status',
      region,
      status_state: status.state,
      status_message: status.message,
    });
    return false;
  }
}

/**
 * List all admins in the Intercom workspace
 */
export async function listAdmins(
  accessToken: string,
  region: IntercomRegion = 'US'
): Promise<IntercomAdmin[] | null> {
  try {
    const baseUrl = INTERCOM_REGIONS[region];
    const response = await fetch(`${baseUrl}/admins`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Intercom-Version': '2.14',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn({ status: response.status, error: errorText, region }, 'List admins failed');
      captureException(new Error('failed to list admins from Intercom'), undefined, {
        operation: 'intercom_list_admins',
        status: response.status,
        error_text: errorText,
        region,
      });
      return null;
    }

    const data = (await response.json()) as IntercomAdminsResponse;
    return data.admins;
  } catch (error) {
    logger.error({ error, region }, 'List admins error');
    captureException(error, undefined, { operation: 'intercom_list_admins' });
    return null;
  }
}
