/**
 * State Machine for DodoPayments Subscription Status
 *
 * Defines valid state transitions to prevent invalid status changes
 * when processing webhooks, especially when they arrive out-of-order.
 *
 * Valid Transitions:
 * - pending   → active, failed
 * - active    → active, on_hold, cancelled, expired
 * - on_hold   → active, cancelled, expired
 * - cancelled → expired (only if cancel_at_period_end=true)
 * - failed    → (terminal)
 * - expired   → (terminal)
 */

import type DodoPayments from 'dodopayments';

import type { SubscriptionStatus } from './types';

/**
 * Subscription webhook event types that trigger status changes
 * Typed to DodoPayments.WebhookEventType for compile-time safety
 */
export type SubscriptionWebhookEventType = Extract<
  DodoPayments.WebhookEventType,
  | 'subscription.active'
  | 'subscription.renewed'
  | 'subscription.plan_changed'
  | 'subscription.on_hold'
  | 'subscription.cancelled'
  | 'subscription.failed'
  | 'subscription.expired'
>;

/**
 * Valid state transitions for subscription statuses
 * Each key maps to an array of valid target statuses
 */
export const VALID_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  pending: ['active', 'failed'],
  active: ['active', 'on_hold', 'cancelled', 'expired'],
  on_hold: ['active', 'cancelled', 'expired'],
  cancelled: ['expired'], // Only valid if cancel_at_period_end=true
  failed: [], // Terminal state
  expired: [], // Terminal state
};

/**
 * Terminal states that cannot transition to any other state
 */
export const TERMINAL_STATES: SubscriptionStatus[] = ['failed', 'expired'];

/**
 * Check if a status is a terminal state
 */
export function isTerminalState(status: SubscriptionStatus): boolean {
  return TERMINAL_STATES.includes(status);
}

/**
 * Check if a state transition is valid
 *
 * @param from - Current subscription status
 * @param to - Target subscription status
 * @returns true if transition is allowed
 */
export function isValidTransition(from: SubscriptionStatus, to: SubscriptionStatus): boolean {
  // Same state transitions are always valid (idempotent)
  if (from === to) return true;

  // Check if the transition is in the allowed list
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Check if cancelled → expired transition is valid based on subscription settings
 *
 * This transition is only valid when cancel_at_period_end=true,
 * meaning the subscription expires at the end of the current billing period.
 *
 * @param cancelAtPeriodEnd - Whether cancellation is scheduled for period end
 * @returns true if the transition is valid
 */
export function isCancelledToExpiredValid(cancelAtPeriodEnd: boolean): boolean {
  return cancelAtPeriodEnd;
}

/**
 * Map webhook event types to target subscription statuses
 * Keys are type-locked to DodoPayments.WebhookEventType
 */
export const EVENT_TO_STATUS: Record<SubscriptionWebhookEventType, SubscriptionStatus> = {
  'subscription.active': 'active',
  'subscription.renewed': 'active',
  'subscription.plan_changed': 'active',
  'subscription.on_hold': 'on_hold',
  'subscription.cancelled': 'cancelled',
  'subscription.failed': 'failed',
  'subscription.expired': 'expired',
} as const;

/**
 * Check if an event type is a subscription webhook event that triggers status change
 */
export function isSubscriptionWebhookEvent(
  eventType: string
): eventType is SubscriptionWebhookEventType {
  const isStatusEvent = eventType in EVENT_TO_STATUS;
  console.log(`[StateMachine] isSubscriptionWebhookEvent: ${eventType} → ${isStatusEvent}`);
  return isStatusEvent;
}

/**
 * Get the target status for a webhook event type
 *
 * @param eventType - The webhook event type
 * @returns The target status, or undefined if not a status-changing event
 */
export function getTargetStatusForEvent(eventType: string): SubscriptionStatus | undefined {
  if (isSubscriptionWebhookEvent(eventType)) {
    const targetStatus = EVENT_TO_STATUS[eventType];
    console.log(`[StateMachine] getTargetStatusForEvent: ${eventType} → ${targetStatus}`);
    return targetStatus;
  }
  console.log(
    `[StateMachine] getTargetStatusForEvent: ${eventType} → undefined (not a status event)`
  );
  return undefined;
}

/**
 * Result of a transition validation
 */
export interface TransitionValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validate a state transition with detailed reasoning
 *
 * @param from - Current subscription status
 * @param to - Target subscription status
 * @param cancelAtPeriodEnd - Whether cancellation is scheduled for period end (for cancelled → expired)
 * @returns Validation result with reason if invalid
 */
export function validateTransition(
  from: SubscriptionStatus,
  to: SubscriptionStatus,
  cancelAtPeriodEnd?: boolean
): TransitionValidationResult {
  console.log(
    `[StateMachine] validateTransition: ${from} → ${to} (cancelAtPeriodEnd=${cancelAtPeriodEnd})`
  );

  // Same state is always valid
  if (from === to) {
    console.log(`[StateMachine] validateTransition: VALID (idempotent, same state)`);
    return { valid: true };
  }

  // Check terminal states
  if (isTerminalState(from)) {
    const result = {
      valid: false,
      reason: `Cannot transition from terminal state '${from}'`,
    };
    console.log(`[StateMachine] validateTransition: INVALID - ${result.reason}`);
    return result;
  }

  // Special case: cancelled → expired requires cancel_at_period_end=true
  if (from === 'cancelled' && to === 'expired') {
    if (cancelAtPeriodEnd === undefined || !cancelAtPeriodEnd) {
      const result = {
        valid: false,
        reason: `Transition '${from}' → '${to}' requires cancel_at_period_end=true`,
      };
      console.log(`[StateMachine] validateTransition: INVALID - ${result.reason}`);
      return result;
    }
    console.log(
      `[StateMachine] validateTransition: VALID (cancelled → expired with cancelAtPeriodEnd)`
    );
    return { valid: true };
  }

  // Standard transition check
  if (!isValidTransition(from, to)) {
    const result = {
      valid: false,
      reason: `Invalid transition: '${from}' → '${to}'`,
    };
    console.log(`[StateMachine] validateTransition: INVALID - ${result.reason}`);
    return result;
  }

  console.log(`[StateMachine] validateTransition: VALID`);
  return { valid: true };
}
