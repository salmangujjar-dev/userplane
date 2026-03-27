/**
 * Slack Signature Verification Middleware
 * Verifies the X-Slack-Signature header using HMAC-SHA256
 * @see https://api.slack.com/authentication/verifying-requests-from-slack
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

import type { Context, MiddlewareHandler } from 'hono';

import { createLogger } from '@/api/lib/logger';

const logger = createLogger('slack-signature');

/**
 * Hono environment type for routes behind the Slack signature middleware.
 * Declares the `rawBody` variable that the middleware stores on the context.
 */
export type SlackSignatureEnv = { Variables: { rawBody: string } };

/**
 * Create middleware to verify Slack request signatures
 * @param signingSecret - The Slack app signing secret used for HMAC verification
 */
export function verifySlackSignature(signingSecret: string): MiddlewareHandler<SlackSignatureEnv> {
  return async (c, next) => {
    const signature = c.req.header('X-Slack-Signature');
    const timestamp = c.req.header('X-Slack-Request-Timestamp');

    if (!signature || !timestamp) {
      logger.warn({ path: c.req.path, method: c.req.method }, 'Missing Slack signature headers');
      return c.json({ error: 'Missing Slack signature headers' }, 401);
    }

    // Replay protection: reject requests older than 5 minutes
    const now = Math.floor(Date.now() / 1000);
    const ts = Number(timestamp);
    if (Number.isNaN(ts) || Math.abs(now - ts) > 300) {
      logger.warn(
        { path: c.req.path, method: c.req.method, timestamp },
        'Slack request timestamp invalid or too old'
      );
      return c.json({ error: 'Request timestamp too old' }, 401);
    }

    // Read the raw body for signature verification
    const rawBody = await c.req.text();

    // Compute expected signature: v0=HMAC-SHA256(signingSecret, "v0:timestamp:body")
    const sigBaseString = `v0:${timestamp}:${rawBody}`;
    const expectedSignature = `v0=${createHmac('sha256', signingSecret).update(sigBaseString).digest('hex')}`;

    // Constant-time comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
      logger.warn({ path: c.req.path, method: c.req.method }, 'Invalid Slack signature');
      return c.json({ error: 'Invalid signature' }, 401);
    }

    // Store raw body for downstream handlers to parse
    c.set('rawBody', rawBody);

    await next();
  };
}

/**
 * Get raw body string from context after signature verification.
 * The raw body is stored by the signature middleware.
 */
export function getRawBody(c: Context<SlackSignatureEnv>): string {
  return c.get('rawBody');
}
