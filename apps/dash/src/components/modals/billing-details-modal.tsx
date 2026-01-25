'use client';

import type { AccessStatus, SubscriptionStatus } from '@workspace/contract';
import type { PlanId, PlanName } from '@workspace/pricing';
import { Badge } from '@workspace/ui/components/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import Logo from '@workspace/ui/components/logo';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle, Clock, Loader2, XCircle } from 'lucide-react';

interface BillingDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: {
    planName: PlanName;
    planId: PlanId;
    status: SubscriptionStatus;
    currentPeriodEnd: Date | string | null;
    cancelAtPeriodEnd: boolean;
    // Extended data
    billingCycle?: string;
    currentPeriodStart?: Date | string | null;
    cancelledAt?: Date | string | null;
    onHoldSince?: Date | string | null;
    accessStatus?: AccessStatus;
  } | null;
  onManagePortal: () => void;
  isPortalLoading?: boolean;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

interface StatusConfig {
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  dotColor: string;
  textColor: string;
  label: string;
  description?: string;
}

const getStatusConfig = (
  status: SubscriptionStatus,
  cancelAtPeriodEnd: boolean,
  daysRemaining?: number
): StatusConfig => {
  switch (status) {
    case 'active':
      return {
        icon: CheckCircle,
        bgColor: 'bg-green-50 dark:bg-green-950/30',
        dotColor: 'bg-green-500',
        textColor: 'text-green-800 dark:text-green-200',
        label: 'Active',
        description: cancelAtPeriodEnd
          ? 'Your subscription will end at the next billing date.'
          : 'Your subscription is active and will renew automatically.',
      };
    case 'on_hold': {
      const days = daysRemaining ?? 0;
      return {
        icon: AlertCircle,
        bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
        dotColor: 'bg-yellow-500',
        textColor: 'text-yellow-800 dark:text-yellow-200',
        label: 'Payment Issue',
        description:
          days > 0
            ? `Payment failed. You have ${days} day${days === 1 ? '' : 's'} to update your payment method.`
            : 'Payment failed. Please update your payment method to continue.',
      };
    }
    case 'cancelled': {
      const days = daysRemaining ?? 0;
      return {
        icon: Clock,
        bgColor: 'bg-muted/50',
        dotColor: 'bg-gray-500',
        textColor: 'text-foreground',
        label: cancelAtPeriodEnd ? 'Cancelling' : 'Cancelled',
        description: cancelAtPeriodEnd
          ? days > 0
            ? `Your subscription ends in ${days} day${days === 1 ? '' : 's'}. You have access until then.`
            : 'Your subscription is cancelled but you have access until the end of the billing period.'
          : 'Your subscription has been cancelled.',
      };
    }
    case 'expired':
      return {
        icon: XCircle,
        bgColor: 'bg-red-50 dark:bg-red-950/30',
        dotColor: 'bg-red-500',
        textColor: 'text-red-800 dark:text-red-200',
        label: 'Expired',
        description: 'Your subscription has expired. Upgrade to restore access.',
      };
    case 'failed':
      return {
        icon: XCircle,
        bgColor: 'bg-red-50 dark:bg-red-950/30',
        dotColor: 'bg-red-500',
        textColor: 'text-red-800 dark:text-red-200',
        label: 'Failed',
        description: 'Subscription creation failed. Please try again.',
      };
    case 'pending':
      return {
        icon: Clock,
        bgColor: 'bg-blue-50 dark:bg-blue-950/30',
        dotColor: 'bg-blue-500',
        textColor: 'text-blue-800 dark:text-blue-200',
        label: 'Pending',
        description: 'Your subscription is being processed.',
      };
  }
};

export function BillingDetailsModal({
  open,
  onOpenChange,
  subscription,
  onManagePortal,
  isPortalLoading = false,
}: BillingDetailsModalProps) {
  if (!subscription) return null;

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return null;
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch {
      return null;
    }
  };

  // Calculate daysRemaining from subscription data
  const calculateDaysRemaining = (): number | undefined => {
    const now = new Date();

    if (subscription.status === 'on_hold' && subscription.onHoldSince) {
      // 14-day grace period from onHoldSince
      const graceEndsAt = new Date(
        new Date(subscription.onHoldSince).getTime() + 14 * 24 * 60 * 60 * 1000
      );
      return Math.max(
        0,
        Math.ceil((graceEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      );
    }

    if (
      subscription.status === 'cancelled' &&
      subscription.cancelAtPeriodEnd &&
      subscription.currentPeriodEnd
    ) {
      const periodEnd = new Date(subscription.currentPeriodEnd);
      return Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
    }

    return undefined;
  };

  const periodStart = formatDate(subscription.currentPeriodStart);
  const periodEnd = formatDate(subscription.currentPeriodEnd);
  const billingCycle = subscription.billingCycle || 'monthly';
  const cancelledAt = formatDate(subscription.cancelledAt);
  const onHoldSince = formatDate(subscription.onHoldSince);
  const daysRemaining = calculateDaysRemaining();

  const statusConfig = getStatusConfig(
    subscription.status,
    subscription.cancelAtPeriodEnd,
    daysRemaining
  );
  const StatusIcon = statusConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <div className="space-y-6 py-4">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Subscription Details</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                View and manage your subscription information
              </DialogDescription>
            </div>
          </div>

          <div className="space-y-4">
            {/* Plan Info */}
            <div className="space-y-3">
              <DetailRow label="Plan" value={subscription.planName} />
              <DetailRow
                label="Billing Cycle"
                value={<span className="capitalize">{billingCycle}</span>}
              />
              <DetailRow
                label="Status"
                value={
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
                    <span className="font-medium">{statusConfig.label}</span>
                  </div>
                }
              />
            </div>

            {/* Warning Banner - Only show for urgent states */}
            {(subscription.status === 'on_hold' ||
              subscription.status === 'expired' ||
              (subscription.status === 'cancelled' && subscription.cancelAtPeriodEnd)) &&
              statusConfig.description && (
                <div className={`p-3 rounded-lg ${statusConfig.bgColor} border border-border/50`}>
                  <div className="flex items-start gap-2">
                    <StatusIcon className={`h-4 w-4 shrink-0 mt-0.5 ${statusConfig.textColor}`} />
                    <p className={`text-sm ${statusConfig.textColor}`}>
                      {statusConfig.description}
                    </p>
                  </div>
                </div>
              )}

            <hr className="border-border" />

            {/* Billing Period */}
            <div className="space-y-3">
              {periodStart && periodEnd && (
                <DetailRow label="Current Period" value={`${periodStart} - ${periodEnd}`} />
              )}
              {periodEnd && !subscription.cancelAtPeriodEnd && subscription.status === 'active' && (
                <DetailRow label="Next Billing" value={periodEnd} />
              )}
              {subscription.cancelAtPeriodEnd && periodEnd && (
                <DetailRow
                  label="Access Until"
                  value={<span className="text-muted-foreground">{periodEnd}</span>}
                />
              )}
              {cancelledAt && <DetailRow label="Cancelled On" value={cancelledAt} />}
              {onHoldSince && <DetailRow label="On Hold Since" value={onHoldSince} />}
              <DetailRow
                label="Auto-Renew"
                value={
                  <Badge
                    variant={subscription.cancelAtPeriodEnd ? 'outline' : 'secondary'}
                    className="text-xs"
                  >
                    {subscription.cancelAtPeriodEnd ? 'Off' : 'On'}
                  </Badge>
                }
              />
            </div>

            {/* Action */}
            <button
              onClick={() => {
                onManagePortal();
                onOpenChange(false);
              }}
              disabled={isPortalLoading}
              className="w-full mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPortalLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Manage in Portal
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
