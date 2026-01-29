/**
 * Intercom Signature Verification Middleware
 * Verifies the X-Body-Signature header using HMAC-SHA256
 * @see https://developers.intercom.com/docs/build-an-integration/learn-more/security
 */

import { createHmac } from 'crypto';
import type { Context, Next } from 'hono';

/**
 * Create middleware to verify Intercom request signatures
 * @param clientSecret - The Intercom app client secret used for HMAC verification
 */
export function verifyIntercomSignature(clientSecret: string) {
  return async (c: Context, next: Next) => {
    const signature = c.req.header('X-Body-Signature');

    if (!signature) {
      return c.json({ error: 'Missing X-Body-Signature header' }, 401);
    }

    // Read the raw body for signature verification
    const body = await c.req.text();

    // Calculate expected signature using HMAC-SHA256
    const expectedSignature = createHmac('sha256', clientSecret).update(body).digest('hex');

    // Constant-time comparison to prevent timing attacks
    if (!timingSafeEqual(signature, expectedSignature)) {
      return c.json({ error: 'Invalid signature' }, 401);
    }

    // Store raw body for downstream handlers to parse
    c.set('rawBody', body);

    await next();
  };
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Get parsed body from context after signature verification
 * The raw body is stored by the signature middleware
 */
export function getParsedBody<T>(c: Context): T {
  const rawBody = c.get('rawBody') as string;
  return JSON.parse(rawBody) as T;
}
