/**
 * Plan display utilities
 * Handles the display logic for subscription status badges
 */

import type { PlanName } from '@workspace/pricing';

export type SubscriptionStatus =
  | 'active'
  | 'on_hold'
  | 'cancelled'
  | 'expired'
  | 'failed'
  | 'pending';

export type AccessReason =
  | 'active'
  | 'cancelled_in_period'
  | 'on_hold_grace'
  | 'no_subscription'
  | 'expired'
  | 'revoked';

interface StatusBadge {
  label: string;
  variant: 'default' | 'warning' | 'destructive' | 'outline';
  className?: string;
}

interface PlanDisplayResult {
  displayName: string;
  variant: 'secondary' | 'warning' | 'destructive';
  showWarning: boolean;
  tooltip?: string;
  statusBadge?: StatusBadge;
  statusMessage?: string;
  actionRequired?: string;
}

/**
 * Get the display properties for a plan badge based on subscription status
 */
export function getPlanDisplay(
  planName: PlanName | string | null,
  status: SubscriptionStatus | string | null,
  cancelAtPeriodEnd?: boolean,
  daysRemaining?: number
): PlanDisplayResult {
  // No subscription = Free plan
  if (!planName || !status) {
    return { displayName: 'Free', variant: 'secondary', showWarning: false };
  }

  switch (status) {
    case 'active':
      return { displayName: planName, variant: 'secondary', showWarning: false };

    case 'on_hold':
      return {
        displayName: planName,
        variant: 'warning',
        showWarning: true,
        tooltip: 'Payment issue - please update billing',
        statusBadge: {
          label: 'Payment Issue',
          variant: 'warning',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        },
        statusMessage: daysRemaining
          ? `Your payment failed. You have ${daysRemaining} days to update your payment method before losing access.`
          : 'Your payment failed. Please update your payment method to continue.',
        actionRequired: 'Update payment method',
      };

    case 'cancelled':
      if (cancelAtPeriodEnd) {
        return {
          displayName: planName,
          variant: 'secondary',
          showWarning: false,
          tooltip: 'Subscription ends at billing period',
          statusBadge: {
            label: 'Cancelling',
            variant: 'outline',
            className: 'text-muted-foreground',
          },
          statusMessage: daysRemaining
            ? `Your subscription will end in ${daysRemaining} days. You'll retain access until then.`
            : 'Your subscription is set to cancel at the end of the billing period.',
          actionRequired: 'Reactivate subscription to continue',
        };
      }
      return {
        displayName: 'Free',
        variant: 'secondary',
        showWarning: false,
        statusBadge: {
          label: 'Cancelled',
          variant: 'outline',
          className: 'text-muted-foreground',
        },
        statusMessage: 'Your subscription has been cancelled. You are now on the Free plan.',
      };

    case 'expired':
      return {
        displayName: 'Free',
        variant: 'secondary',
        showWarning: false,
        statusBadge: {
          label: 'Expired',
          variant: 'outline',
          className: 'text-muted-foreground',
        },
        statusMessage: 'Your subscription has expired. Upgrade to restore your previous plan.',
      };

    case 'failed':
      return {
        displayName: 'Free',
        variant: 'destructive',
        showWarning: true,
        statusBadge: {
          label: 'Failed',
          variant: 'destructive',
        },
        statusMessage: 'Your subscription payment failed. Please update your payment method.',
        actionRequired: 'Update payment method',
      };

    case 'pending':
      return {
        displayName: planName,
        variant: 'secondary',
        showWarning: false,
        tooltip: 'Subscription pending',
        statusBadge: {
          label: 'Pending',
          variant: 'outline',
        },
        statusMessage: 'Your subscription is being processed.',
      };

    default:
      return { displayName: 'Free', variant: 'secondary', showWarning: false };
  }
}

/**
 * Get extended display info based on access status from API
 */
export function getAccessStatusDisplay(
  accessReason: AccessReason | string | null,
  daysRemaining?: number
): {
  badge?: StatusBadge;
  message?: string;
  actionRequired?: string;
  isUrgent: boolean;
} {
  switch (accessReason) {
    case 'active':
      return { isUrgent: false };

    case 'on_hold_grace':
      return {
        badge: {
          label: 'Payment Issue',
          variant: 'warning',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        },
        message: daysRemaining
          ? `Payment failed. ${daysRemaining} days left to update payment before losing access.`
          : 'Payment failed. Update your payment method to continue.',
        actionRequired: 'Update payment method',
        isUrgent: (daysRemaining ?? 0) <= 3,
      };

    case 'cancelled_in_period':
      return {
        badge: {
          label: 'Cancelling',
          variant: 'outline',
          className: 'text-muted-foreground',
        },
        message: daysRemaining
          ? `Subscription ends in ${daysRemaining} days.`
          : 'Subscription ends at billing period.',
        actionRequired: 'Reactivate to keep features',
        isUrgent: false,
      };

    case 'expired':
      return {
        badge: {
          label: 'Expired',
          variant: 'outline',
          className: 'text-muted-foreground',
        },
        message: 'Your subscription has expired.',
        isUrgent: false,
      };

    case 'revoked':
      return {
        badge: {
          label: 'Access Revoked',
          variant: 'destructive',
        },
        message: 'Access revoked due to payment issues.',
        actionRequired: 'Update payment to restore access',
        isUrgent: true,
      };

    case 'no_subscription':
    default:
      return { isUrgent: false };
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
