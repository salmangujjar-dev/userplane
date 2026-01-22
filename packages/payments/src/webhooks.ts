/**
 * Webhook utilities for DodoPayments
 *
 * Handles webhook signature verification and payload parsing.
 */

import type {
  DodoSubscription,
  SubscriptionStatus,
  SubscriptionWebhookEvent,
  WebhookPayload,
} from './types';

/**
 * Subscription webhook event types
 */
export const SUBSCRIPTION_EVENTS: SubscriptionWebhookEvent[] = [
  'subscription.active',
  'subscription.updated',
  'subscription.on_hold',
  'subscription.renewed',
  'subscription.plan_changed',
  'subscription.cancelled',
  'subscription.failed',
  'subscription.expired',
];

/**
 * Check if an event type is a subscription event
 */
export function isSubscriptionEvent(eventType: string): eventType is SubscriptionWebhookEvent {
  return SUBSCRIPTION_EVENTS.includes(eventType as SubscriptionWebhookEvent);
}

/**
 * Map DodoPayments subscription status to internal status
 */
export function mapSubscriptionStatus(status: string): SubscriptionStatus {
  const validStatuses: SubscriptionStatus[] = [
    'pending',
    'active',
    'on_hold',
    'cancelled',
    'failed',
    'expired',
  ];

  if (validStatuses.includes(status as SubscriptionStatus)) {
    return status as SubscriptionStatus;
  }

  // Default to pending for unknown statuses
  return 'pending';
}

/**
 * Parse subscription dates from webhook payload
 */
export function parseSubscriptionDates(subscription: DodoSubscription): {
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelledAt: Date | null;
  createdAt: Date;
} {
  return {
    currentPeriodStart: subscription.previous_billing_date
      ? new Date(subscription.previous_billing_date)
      : new Date(subscription.created_at),
    currentPeriodEnd: new Date(subscription.next_billing_date),
    cancelledAt: subscription.cancelled_at ? new Date(subscription.cancelled_at) : null,
    createdAt: new Date(subscription.created_at),
  };
}

/**
 * Extract workspace ID from subscription metadata
 *
 * The workspace ID should be passed as metadata when creating the checkout session.
 */
export function extractWorkspaceIdFromMetadata(
  metadata: Record<string, string> | undefined
): string | undefined {
  return metadata?.workspace_id || metadata?.workspaceId;
}

/**
 * Webhook event handlers type
 */
export interface WebhookHandlers {
  onSubscriptionActive?: (subscription: DodoSubscription) => Promise<void>;
  onSubscriptionUpdated?: (subscription: DodoSubscription) => Promise<void>;
  onSubscriptionOnHold?: (subscription: DodoSubscription) => Promise<void>;
  onSubscriptionRenewed?: (subscription: DodoSubscription) => Promise<void>;
  onSubscriptionPlanChanged?: (subscription: DodoSubscription) => Promise<void>;
  onSubscriptionCancelled?: (subscription: DodoSubscription) => Promise<void>;
  onSubscriptionFailed?: (subscription: DodoSubscription) => Promise<void>;
  onSubscriptionExpired?: (subscription: DodoSubscription) => Promise<void>;
}

/**
 * Process a webhook payload and route to appropriate handler
 */
export async function processWebhookPayload(
  payload: WebhookPayload,
  handlers: WebhookHandlers
): Promise<void> {
  const { event_type, data } = payload;

  switch (event_type) {
    case 'subscription.active':
      await handlers.onSubscriptionActive?.(data);
      break;
    case 'subscription.updated':
      await handlers.onSubscriptionUpdated?.(data);
      break;
    case 'subscription.on_hold':
      await handlers.onSubscriptionOnHold?.(data);
      break;
    case 'subscription.renewed':
      await handlers.onSubscriptionRenewed?.(data);
      break;
    case 'subscription.plan_changed':
      await handlers.onSubscriptionPlanChanged?.(data);
      break;
    case 'subscription.cancelled':
      await handlers.onSubscriptionCancelled?.(data);
      break;
    case 'subscription.failed':
      await handlers.onSubscriptionFailed?.(data);
      break;
    case 'subscription.expired':
      await handlers.onSubscriptionExpired?.(data);
      break;
    default:
      // Unknown event type - log and ignore
      console.warn(`Unknown webhook event type: ${event_type}`);
  }
}
