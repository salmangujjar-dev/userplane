/**
 * Webhook utilities for DodoPayments
 *
 * Handles webhook signature verification and payload parsing.
 * Uses official types from the dodopayments package.
 */

import type DodoPayments from 'dodopayments';

import type {
  DisputeEventType,
  DodoSubscription,
  RefundEventType,
  SubscriptionStatus,
  WebhookPayload,
} from './types';

/**
 * Subscription webhook event types from DodoPayments
 */
const SUBSCRIPTION_EVENTS: readonly DodoPayments.WebhookEventType[] = [
  'subscription.active',
  'subscription.updated',
  'subscription.on_hold',
  'subscription.renewed',
  'subscription.plan_changed',
  'subscription.cancelled',
  'subscription.failed',
  'subscription.expired',
] as const;

type SubscriptionEventType = Extract<
  DodoPayments.WebhookEventType,
  | 'subscription.active'
  | 'subscription.updated'
  | 'subscription.on_hold'
  | 'subscription.renewed'
  | 'subscription.plan_changed'
  | 'subscription.cancelled'
  | 'subscription.failed'
  | 'subscription.expired'
>;

/**
 * Check if an event type is a subscription event
 */
export function isSubscriptionEvent(eventType: string): eventType is SubscriptionEventType {
  return SUBSCRIPTION_EVENTS.includes(eventType as SubscriptionEventType);
}

/**
 * Dispute webhook event types from DodoPayments
 */
const DISPUTE_EVENTS = [
  'dispute.opened',
  'dispute.expired',
  'dispute.accepted',
  'dispute.cancelled',
  'dispute.challenged',
  'dispute.won',
  'dispute.lost',
] as const;

/**
 * Check if an event type is a dispute event
 */
export function isDisputeEvent(eventType: string): eventType is DisputeEventType {
  return DISPUTE_EVENTS.includes(eventType as DisputeEventType);
}

/**
 * Refund webhook event types from DodoPayments
 */
const REFUND_EVENTS = ['refund.succeeded', 'refund.failed'] as const;

/**
 * Check if an event type is a refund event
 */
export function isRefundEvent(eventType: string): eventType is RefundEventType {
  return REFUND_EVENTS.includes(eventType as RefundEventType);
}

/**
 * Type guard to check if a webhook payload is a subscription event
 */
export function isSubscriptionWebhook(
  payload: WebhookPayload
): payload is WebhookPayload & { data: DodoSubscription } {
  return isSubscriptionEvent(payload.type);
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
    currentPeriodStart: new Date(subscription.previous_billing_date),
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
 * Subscription webhook payload type (for subscription events only)
 */
export type SubscriptionWebhookPayload = WebhookPayload & { data: DodoSubscription };

/**
 * Process a webhook payload and route to appropriate handler
 */
export async function processWebhookPayload(
  payload: WebhookPayload,
  handlers: WebhookHandlers
): Promise<void> {
  if (!isSubscriptionWebhook(payload)) {
    console.warn(`Ignoring non-subscription webhook event: ${payload.type}`);
    return;
  }

  const { type: eventType, data } = payload;

  switch (eventType) {
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
      console.warn(`Unknown subscription webhook event type: ${eventType}`);
  }
}
