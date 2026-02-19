'use client';

import type { PlanId, PlanName } from '@workspace/pricing';
import { UNLIMITED_QUOTED_LIMIT } from '@workspace/pricing';
import { Badge } from '@workspace/ui/components/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import Logo from '@workspace/ui/components/logo';
import { Progress } from '@workspace/ui/components/progress';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle, Clock, Loader2, MoveUpRight, XCircle } from 'lucide-react';

import type { AccessDetail, ResourceUsage, SubscriptionStatus } from '@/types';

interface UsageEntry {
  label: string;
  usage: ResourceUsage;
}

interface BillingDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: {
    planName: PlanName;
    planId: PlanId;
    status: SubscriptionStatus;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    // Extended data
    billingCycle?: string;
    currentPeriodStart?: Date | null;
    cancelledAt?: Date | null;
    onHoldSince?: Date | null;
    accessStatus?: AccessDetail;
  } | null;
  onManagePortal: () => void;
  onUpgradePlan?: () => void;
  isPortalLoading?: boolean;
  usage?: UsageEntry[];
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
  onUpgradePlan,
  isPortalLoading = false,
  usage,
}: BillingDetailsModalProps) {
  if (!subscription) return null;

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return null;
    try {
      return format(date, 'MMM d, yyyy');
    } catch {
      return null;
    }
  };

  // Calculate daysRemaining from subscription data
  const calculateDaysRemaining = (): number | undefined => {
    const now = new Date();

    if (subscription.status === 'on_hold' && subscription.onHoldSince) {
      // 14-day grace period from onHoldSince
      const graceEndsAt = new Date(subscription.onHoldSince.getTime() + 14 * 24 * 60 * 60 * 1000);
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
      return Math.max(
        0,
        Math.ceil((subscription.currentPeriodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      );
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
      <DialogContent
        className="p-0 gap-0 max-w-[calc(100%-2rem)] sm:max-w-4xl max-h-[85vh] overflow-y-auto"
        showCloseButton={true}
      >
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Subscription Details</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                View and manage your subscription information
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Panel */}
            <div className="flex flex-col md:col-span-1">
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
                  <div
                    className={`p-3 rounded-lg mt-4 ${statusConfig.bgColor} border border-border/50`}
                  >
                    <div className="flex items-start gap-2">
                      <StatusIcon className={`h-4 w-4 shrink-0 mt-0.5 ${statusConfig.textColor}`} />
                      <p className={`text-sm ${statusConfig.textColor}`}>
                        {statusConfig.description}
                      </p>
                    </div>
                  </div>
                )}

              {/* Spacer to push content to bottom */}
              <div className="flex-1" />

              {/* How Your Subscription Works */}
              <div className="pt-6">
                <h4 className="text-base font-semibold text-foreground mb-4">
                  How your subscription works
                </h4>

                <div className="relative space-y-4">
                  {/* Timeline connector line */}
                  <div className="absolute left-1.5 top-6 bottom-6 w-px bg-zinc-200" />

                  {/* Billing */}
                  <div className="relative flex items-start gap-3">
                    <div className="relative z-10 w-3 h-3 rounded-full bg-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground mb-1">
                        <span className="capitalize">{billingCycle}</span> Billing
                      </div>
                      <div className="text-xs text-zinc-600 leading-relaxed">
                        {subscription.cancelAtPeriodEnd
                          ? 'Auto-renew is off. Your plan will end at the current period.'
                          : `Your plan renews automatically each ${billingCycle === 'annual' ? 'year' : 'month'}.`}
                      </div>
                    </div>
                  </div>

                  {/* Next Date */}
                  <div className="relative flex items-start gap-3">
                    <div className="relative z-10 w-3 h-3 rounded-full bg-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground mb-1">
                        {subscription.cancelAtPeriodEnd ? 'Access Ends' : 'Next Renewal'}
                      </div>
                      <div className="text-xs text-zinc-600 leading-relaxed">
                        {periodEnd
                          ? subscription.cancelAtPeriodEnd
                            ? `Your access continues until ${periodEnd}.`
                            : `Your next billing date is ${periodEnd}.`
                          : 'No upcoming billing date.'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="flex flex-col md:col-span-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col h-full">
                {/* Plan Hero */}
                <div className="text-center pb-6 mb-6 border-b border-zinc-100">
                  <div className="text-sm text-zinc-600 mb-3">Current Plan</div>
                  <div className="text-4xl font-bold text-foreground">{subscription.planName}</div>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
                    <span className="text-sm font-medium text-foreground">
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                {/* Billing Details */}
                <div className="mb-6">
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                    Billing Details
                  </div>
                  <div className="space-y-3">
                    {periodStart && periodEnd && (
                      <DetailRow label="Current Period" value={`${periodStart} - ${periodEnd}`} />
                    )}
                    {periodEnd &&
                      !subscription.cancelAtPeriodEnd &&
                      subscription.status === 'active' && (
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
                </div>

                {/* Usage */}
                {usage && usage.length > 0 && (
                  <>
                    <div className="border-t border-zinc-100 my-6" />
                    <div>
                      <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                        Usage
                      </div>
                      <div className="space-y-4">
                        {usage.map((entry) => {
                          const isOverLimit =
                            entry.usage.limit !== UNLIMITED_QUOTED_LIMIT &&
                            entry.usage.percentUsed > 100;
                          const displayPercent = Math.min(100, entry.usage.percentUsed);

                          return (
                            <div key={entry.label} className="space-y-1.5">
                              <div className="flex justify-between text-sm">
                                <span className="text-zinc-600">{entry.label}</span>
                                <span
                                  className={`font-semibold ${isOverLimit ? 'text-red-600' : 'text-foreground'}`}
                                >
                                  {entry.usage.consumed}/
                                  {entry.usage.limit === UNLIMITED_QUOTED_LIMIT
                                    ? '\u221e'
                                    : entry.usage.limit}
                                </span>
                              </div>
                              <Progress
                                value={displayPercent}
                                className={`h-1.5 ${isOverLimit ? '[&>div]:bg-red-600' : ''}`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* Spacer to push buttons to bottom */}
                <div className="flex-1" />

                {/* Actions */}
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => {
                      onManagePortal();
                      onOpenChange(false);
                    }}
                    disabled={isPortalLoading}
                    className="flex-1 px-6 py-3 text-sm font-medium rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isPortalLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Manage in Portal
                  </button>
                  {onUpgradePlan && (
                    <button
                      onClick={() => {
                        onUpgradePlan();
                        onOpenChange(false);
                      }}
                      className="flex-1 px-6 py-3 text-sm font-medium rounded-full border border-border hover:bg-accent transition-colors flex items-center justify-center gap-2"
                    >
                      <MoveUpRight className="h-4 w-4" />
                      Upgrade Plan
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
