/**
 * Zendesk App JWT utilities
 * Handles ZAF JWT verification and session JWT signing/verification
 */

import jwt from 'jsonwebtoken';

import { createLogger } from '@/api/lib/logger';

const logger = createLogger('zendesk-jwt');

/** Zendesk session JWT expiry: 15 minutes */
const ZENDESK_SESSION_EXPIRES_IN = 15 * 60;

export interface ZendeskSessionPayload {
  workspaceId: string;
  integrationId: string;
  subdomain: string;
  iat: number;
  exp: number;
}

/**
 * Verify a ZAF-signed JWT (HS256)
 * The ZAF proxy signs these using the shared jwt_secret secure setting
 */
export function verifyZafJwt(
  token: string,
  secret: string
): { workspaceId: string; subdomain: string } | null {
  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    }) as { ws_id?: string; subdomain?: string };

    if (!payload.ws_id || !payload.subdomain) {
      logger.warn({ claims: Object.keys(payload) }, 'ZAF JWT missing required claims');
      return null;
    }

    return { workspaceId: payload.ws_id, subdomain: payload.subdomain };
  } catch (error) {
    const code = error instanceof Error ? error.message : 'unknown';
    logger.warn({ error, code }, 'ZAF JWT verification failed');
    return null;
  }
}

/**
 * Sign a short-lived session JWT for ORPC calls
 */
export function signSessionJwt(
  payload: { workspaceId: string; integrationId: string; subdomain: string },
  secret: string
): string {
  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: ZENDESK_SESSION_EXPIRES_IN,
  });
}

/**
 * Verify a session JWT (HS256) for ORPC middleware
 * Returns null if invalid or expired
 */
export function verifySessionJwt(token: string, secret: string): ZendeskSessionPayload | null {
  try {
    return jwt.verify(token, secret, {
      algorithms: ['HS256'],
    }) as ZendeskSessionPayload;
  } catch {
    return null;
  }
}
