/**
 * PostHog Feature Flags - Subscription plan override via feature flags
 *
 * Uses a separate PostHog client configured for local flag evaluation only.
 * No events are sent from this client.
 *
 * Flag: `subscription-plan-override` (multivariate)
 * - Returns a PlanId string when override is active
 * - Returns false/undefined when no override
 * - On override, sets accessStatus to 'active'
 */
import type { SubscriptionAccessStatus } from '@workspace/contract';
import type { PlanId } from '@workspace/pricing';
import { PLAN_IDS } from '@workspace/pricing';
import { PostHog } from 'posthog-node';

import { env } from '@/api/env';
import { createLogger } from '@/api/lib/logger';

const logger = createLogger('posthog-feature-flags');

// Configured flag key for subscription plan overrides
const SUBSCRIPTION_FLAG_KEY = 'subscription-plan-override';

// Configured to be 10 minute polling interval for local evaluation
const FLAG_POLLING_INTERVAL = 600000;

let featureFlagsClient: PostHog | null = null;

/**
 * Initialize the PostHog feature flags client
 * Uses a separate client from the main PostHog client, configured for
 * local flag evaluation only with no event sending.
 */
export function initPostHogFeatureFlags(): void {
  if (!env.posthog.apiKey || !env.posthog.featureFlagsKey) {
    logger.debug('PostHog project API key or feature flags key not set, skipping initialization');
    return;
  }

  featureFlagsClient = new PostHog(env.posthog.apiKey, {
    host: env.posthog.host,
    // Personal API key for polling /api/feature_flag/local_evaluation
    personalApiKey: env.posthog.featureFlagsKey,
    // Disable event sending — this client is flag-eval only
    flushAt: 0,
    flushInterval: 0,
    // Polling interval for local evaluation
    featureFlagsPollingInterval: FLAG_POLLING_INTERVAL,
  });

  logger.debug('PostHog feature flags client initialized');
}

/**
 * Gracefully shutdown the feature flags client
 */
export async function shutdownPostHogFeatureFlags(): Promise<void> {
  if (!featureFlagsClient) return;

  await featureFlagsClient.shutdown();
  featureFlagsClient = null;
  logger.debug('PostHog feature flags client shutdown complete');
}

/**
 * Get feature flag override for a workspace's subscription access status.
 *
 * Returns a SubscriptionAccessStatus override if the flag is active for the
 * given workspace, or null if no override should be applied.
 *
 * Gracefully degrades: returns null on any error.
 */
export async function getSubscriptionAccessStatusFeatureFlagOverride(
  workspaceId: string
): Promise<SubscriptionAccessStatus | null> {
  if (!featureFlagsClient) return null;

  try {
    const flagValue = await featureFlagsClient.getFeatureFlag(SUBSCRIPTION_FLAG_KEY, workspaceId, {
      onlyEvaluateLocally: true,
      personProperties: { distinct_id: workspaceId },
    });

    // No override if flag is false, undefined, or true (non-multivariate)
    if (!flagValue || typeof flagValue !== 'string') {
      return null;
    }

    // Validate that the returned value is a valid PlanId
    if (!(PLAN_IDS as readonly string[]).includes(flagValue)) {
      logger.warn({ workspaceId, flagValue }, 'Invalid plan ID from feature flag override');
      return null;
    }

    return {
      effectivePlanId: flagValue as PlanId,
      accessStatus: 'active',
    };
  } catch (error) {
    logger.error({ err: error, workspaceId }, 'Error evaluating feature flag override');
    return null;
  }
}
