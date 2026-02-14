/**
 * PostHog client for API error tracking
 * Singleton pattern matching apps/dash/instrumentation.ts
 */
import { PostHog } from 'posthog-node';

import { env } from '@/api/env';
import { createLogger } from '@/api/lib/logger';

const logger = createLogger('posthog');

let posthogClient: PostHog | null = null;

/**
 * Initialize the PostHog client
 * Must be called at startup before any captures
 */
export function initPostHog(): void {
  if (!env.posthog.apiKey) {
    logger.warn('PostHog API key is not set, skipping initialization');
    return;
  }

  posthogClient = new PostHog(env.posthog.apiKey, {
    host: env.posthog.host,
    flushAt: 1,
    flushInterval: 0,
  });

  logger.debug('PostHog initialized');
}

/**
 * Capture an exception with standard properties
 * Always injects `app: 'api'` and `environment`
 */
export function captureException(
  error: unknown,
  distinctId?: string,
  additionalProperties?: Record<string, unknown>
): void {
  if (!posthogClient) return;

  posthogClient.captureException(error, distinctId, {
    app: 'api',
    environment: env.server.nodeEnv,
    ...additionalProperties,
  });
}

/**
 * Gracefully flush and shutdown the PostHog client
 */
export async function shutdownPostHog(): Promise<void> {
  if (!posthogClient) return;

  await posthogClient.flush();
  await posthogClient.shutdown();
  posthogClient = null;
  logger.debug('PostHog shutdown complete');
}
