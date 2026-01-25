/**
 * Plan display utilities
 * Handles the display logic for subscription status
 */

import type { SubscriptionStatus as PaymentSubscriptionStatus } from '@workspace/payments';
import type { PlanName } from '@workspace/pricing';

export type SubscriptionStatus = PaymentSubscriptionStatus;

interface PlanDisplayResult {
  displayName: string;
  statusMessage?: string;
  isUrgent?: boolean;
}

/**
 * Get the display properties for a plan based on subscription status
 * Returns the effective plan name for sidebar display
 * Additional status details are shown in the detailed Review section
 */
export function getPlanDisplay(
  planName: PlanName | string | null,
  status: SubscriptionStatus | string | null,
  cancelAtPeriodEnd?: boolean,
  daysRemaining?: number
): PlanDisplayResult {
  if (!planName || !status) {
    return { displayName: 'Free' };
  }

  switch (status) {
    case 'active':
      return { displayName: planName };

    case 'on_hold':
      return {
        displayName: planName,
        statusMessage: daysRemaining
          ? `Payment failed. ${daysRemaining} days left to update payment method before losing access.`
          : 'Payment failed. Update your payment method to continue.',
        isUrgent: (daysRemaining ?? 0) <= 3,
      };

    case 'cancelled':
      if (cancelAtPeriodEnd) {
        return {
          displayName: planName,
          statusMessage: daysRemaining
            ? `Subscription ending in ${daysRemaining} days. Reactivate to continue after that.`
            : 'Subscription set to cancel at end of billing period. Reactivate to continue.',
        };
      }
      return {
        displayName: 'Free',
        statusMessage: 'Subscription cancelled. Now on Free plan.',
      };

    case 'expired':
      return {
        displayName: 'Free',
        statusMessage: 'Subscription expired. Upgrade to restore previous plan.',
      };

    case 'failed':
      return {
        displayName: 'Free',
        statusMessage: 'Payment failed. Update your payment method to restore subscription.',
      };

    case 'pending':
      return {
        displayName: planName,
        statusMessage: 'Subscription being processed.',
      };

    default:
      return { displayName: 'Free' };
  }
}

/**
 * Determine the "effective" plan for entitlement purposes
 * Used to decide which limits apply
 */
export function getEffectivePlanId(
  planId: string | null,
  status: SubscriptionStatus | string | null,
  cancelAtPeriodEnd?: boolean
): string {
  if (!planId || !status) return 'free';

  // These statuses mean paid features are still active
  if (status === 'active' || status === 'on_hold' || status === 'pending') {
    return planId;
  }

  // Cancelled but still in period = paid features active
  if (status === 'cancelled' && cancelAtPeriodEnd) {
    return planId;
  }

  // Otherwise fall back to free
  return 'free';
}
