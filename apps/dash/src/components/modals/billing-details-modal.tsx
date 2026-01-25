'use client';

import { Badge } from '@workspace/ui/components/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import Logo from '@workspace/ui/components/logo';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

import type { AccessReason } from '@/lib/plan-display';

interface AccessStatusData {
  hasAccess: boolean;
  effectivePlanId: string;
  reason: AccessReason;
  expiresAt?: Date | string | null;
  daysRemaining?: number;
}

interface BillingDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: {
    planName: string;
    planId: string;
    status: string;
    currentPeriodEnd: Date | string | null;
    cancelAtPeriodEnd: boolean;
    // Extended data
    billingCycle?: string;
    currentPeriodStart?: Date | string | null;
    cancelledAt?: Date | string | null;
    onHoldSince?: Date | string | null;
    accessStatus?: AccessStatusData;
  } | null;
  onManagePortal: () => void;
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
  status: string,
  cancelAtPeriodEnd: boolean,
  accessStatus?: AccessStatusData
): StatusConfig => {
  // Check access reason first for more specific messaging
  if (accessStatus?.reason === 'revoked') {
    return {
      icon: XCircle,
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      dotColor: 'bg-red-500',
      textColor: 'text-red-800 dark:text-red-200',
      label: 'Access Revoked',
      description: 'Your access has been revoked due to payment issues.',
    };
  }

  if (accessStatus?.reason === 'on_hold_grace') {
    const days = accessStatus.daysRemaining ?? 0;
    return {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
      dotColor: 'bg-yellow-500',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      label: 'Payment Issue',
      description:
        days > 0
          ? `You have ${days} day${days === 1 ? '' : 's'} to update your payment method.`
          : 'Please update your payment method to continue.',
    };
  }

  if (accessStatus?.reason === 'cancelled_in_period') {
    const days = accessStatus.daysRemaining ?? 0;
    return {
      icon: Clock,
      bgColor: 'bg-muted/50',
      dotColor: 'bg-gray-500',
      textColor: 'text-foreground',
      label: 'Cancelling',
      description:
        days > 0
          ? `Your subscription ends in ${days} day${days === 1 ? '' : 's'}. You have access until then.`
          : 'Your subscription ends at the end of this billing period.',
    };
  }

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
    case 'on_hold':
      return {
        icon: AlertCircle,
        bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
        dotColor: 'bg-yellow-500',
        textColor: 'text-yellow-800 dark:text-yellow-200',
        label: 'On Hold',
        description: 'Payment failed. Please update your payment method.',
      };
    case 'cancelled':
      return {
        icon: Clock,
        bgColor: 'bg-muted/50',
        dotColor: 'bg-gray-500',
        textColor: 'text-foreground',
        label: 'Cancelled',
        description: cancelAtPeriodEnd
          ? 'Your subscription is cancelled but you have access until the end of the billing period.'
          : 'Your subscription has been cancelled.',
      };
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
    default:
      return {
        icon: Clock,
        bgColor: 'bg-muted/50',
        dotColor: 'bg-gray-500',
        textColor: 'text-foreground',
        label: status.replace('_', ' '),
      };
  }
};

export function BillingDetailsModal({
  open,
  onOpenChange,
  subscription,
  onManagePortal,
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

  const periodStart = formatDate(subscription.currentPeriodStart);
  const periodEnd = formatDate(subscription.currentPeriodEnd);
  const billingCycle = subscription.billingCycle || 'monthly';
  const cancelledAt = formatDate(subscription.cancelledAt);
  const onHoldSince = formatDate(subscription.onHoldSince);

  const statusConfig = getStatusConfig(
    subscription.status,
    subscription.cancelAtPeriodEnd,
    subscription.accessStatus
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
            {/* Prominent Status Banner */}
            <div className={`p-4 rounded-lg ${statusConfig.bgColor}`}>
              <div className="flex items-start gap-3">
                <StatusIcon className={`h-5 w-5 shrink-0 mt-0.5 ${statusConfig.textColor}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${statusConfig.textColor}`}>
                      {statusConfig.label}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
                  </div>
                  {statusConfig.description && (
                    <p className={`text-sm mt-1 ${statusConfig.textColor} opacity-90`}>
                      {statusConfig.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Plan Info */}
            <div className="space-y-3">
              <DetailRow label="Plan" value={subscription.planName} />
              <DetailRow
                label="Billing Cycle"
                value={<span className="capitalize">{billingCycle}</span>}
              />
            </div>

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
              className="w-full mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Manage in Portal
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
