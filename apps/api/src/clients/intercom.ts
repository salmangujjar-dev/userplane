/**
 * Intercom API client
 * Handles OAuth flow and API calls to Intercom
 */

import type { IntercomRegion } from '@workspace/contract';
import { createAppLogger } from '@workspace/logger';

import { env } from '@/api/env';

const logger = createAppLogger('intercom-client');

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
 */
export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.intercom.clientId,
    state,
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
      logger.error({ status: response.status, error: errorText }, 'Token exchange failed');
      return null;
    }

    const data = (await response.json()) as IntercomTokenResponse;
    return data;
  } catch (error) {
    logger.error({ error }, 'Token exchange error');
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
      logger.error({ status: response.status, error: errorText, region }, 'Get /me failed');
      return null;
    }

    const data = (await response.json()) as IntercomMeResponse;
    return data;
  } catch (error) {
    logger.error({ error, region }, 'Get /me error');
    return null;
  }
}

/**
 * Auto-detect region and get admin info
 * Tries US first, then EU, then AU
 */
export async function detectRegionAndGetMe(
  accessToken: string
): Promise<{ me: IntercomMeResponse; region: IntercomRegion } | null> {
  const regions: IntercomRegion[] = ['US', 'EU', 'AU'];

  for (const region of regions) {
    const me = await getMe(accessToken, region);
    if (me) {
      return { me, region };
    }
  }

  return null;
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
      logger.error({ status: response.status, error: errorText, region }, 'List admins failed');
      return null;
    }

    const data = (await response.json()) as IntercomAdminsResponse;
    return data.admins;
  } catch (error) {
    logger.error({ error, region }, 'List admins error');
    return null;
  }
}
