'use client';

import type { PlanId } from '@workspace/pricing';
import { Badge } from '@workspace/ui/components/badge';
import { Progress } from '@workspace/ui/components/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { ArrowUpRight, Clock, CreditCard, FileText, Info, Loader2 } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useState } from 'react';

import { BillingDetailsModal } from '@/components/modals/billing-details-modal';
import { PlanSelectionModal } from '@/components/modals/plan-selection-modal';
import { SectionError } from '@/components/shared/section-error';
import { useWorkspace } from '@/hooks/use-workspace';
import { planModalParser } from '@/lib/parsers';
import { getAccessStatusDisplay, getPlanDisplay } from '@/lib/plan-display';
import { useSubscriptionStatus, useUsageSummary } from '@/queries/use-billing-queries';
import { useCreateCheckout, useOpenCustomerPortal } from '@/queries/use-checkout-mutations';

export function WorkspacePlanSection() {
  const { data: workspaceResult, isLoading, error, refetch } = useWorkspace();
  const { data: subscriptionResult } = useSubscriptionStatus();
  const { data: usageResult } = useUsageSummary();
  const workspaceData = workspaceResult?.success ? workspaceResult.data : null;
  const subscriptionData = subscriptionResult?.success ? subscriptionResult.data : null;
  const usageData = usageResult?.success ? usageResult.data : null;
  const workspaceId = workspaceData?.workspace?.workspaceId;

  // Get resource usage
  const recordingsUsage = usageData?.resources?.recordings;
  const seatsUsage = usageData?.resources?.seats;

  // Get plan display based on subscription status
  const planDisplay = getPlanDisplay(
    subscriptionData?.planName ?? null,
    subscriptionData?.status ?? null,
    subscriptionData?.cancelAtPeriodEnd,
    subscriptionData?.accessStatus?.daysRemaining
  );

  // Get access status display for messaging
  const accessDisplay = getAccessStatusDisplay(
    subscriptionData?.accessStatus?.reason ?? null,
    subscriptionData?.accessStatus?.daysRemaining
  );

  const [, setPlanModal] = useQueryState('plan-modal', planModalParser);
  const [showBillingDetails, setShowBillingDetails] = useState(false);

  const { mutate: createCheckout } = useCreateCheckout();
  const { mutate: openCustomerPortal, isPending: isPortalPending } = useOpenCustomerPortal();

  const hasSubscription = subscriptionData?.hasSubscription;

  const handlePlanSelect = (planId: string) => {
    if (!workspaceId) return;

    // Create checkout with selected plan ID
    // The API will handle converting planId to the correct product slug
    createCheckout({
      planId: planId as PlanId,
      workspaceId,
    });

    setPlanModal(null);
  };

  const handleManageBilling = () => {
    openCustomerPortal();
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Workspace Plan</h2>
          <p className="text-sm text-muted-foreground">
            Manage your workspace subscription and plan details
          </p>
        </div>
        <div className="max-w-2xl rounded-xl border bg-card p-6">
          <div className="h-7 w-24 bg-muted animate-pulse rounded mb-4" />
          <div className="space-y-4">
            <div className="h-16 bg-muted animate-pulse rounded" />
            <div className="h-16 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || (workspaceResult && !workspaceResult.success)) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Workspace Plan</h2>
          <p className="text-sm text-muted-foreground">
            Manage your workspace subscription and plan details
          </p>
        </div>
        <div className="max-w-2xl">
          <SectionError
            title="Failed to load plan details"
            description={
              error instanceof Error
                ? error.message
                : workspaceResult && !workspaceResult.success
                  ? workspaceResult.error.message
                  : 'Something went wrong while loading plan details.'
            }
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Workspace Plan</h2>
          <p className="text-sm text-muted-foreground">
            Manage your workspace subscription and plan details
          </p>
        </div>
        <div className="max-w-2xl rounded-xl border bg-card p-6">
          {/* Plan Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h4 className="text-xl font-semibold">{planDisplay.displayName}</h4>
              {planDisplay.statusBadge && (
                <Badge
                  variant={
                    planDisplay.statusBadge.variant === 'warning'
                      ? 'outline'
                      : planDisplay.statusBadge.variant
                  }
                  className={`text-xs ${planDisplay.statusBadge.className || ''}`}
                >
                  {planDisplay.statusBadge.label}
                </Badge>
              )}
            </div>
            {hasSubscription ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBillingDetails(true)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Review
                </button>
                <button
                  onClick={handleManageBilling}
                  disabled={isPortalPending}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-accent transition-colors flex items-center gap-2 ${
                    isPortalPending ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isPortalPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Manage
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setPlanModal('suggested')}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-accent transition-colors flex items-center gap-2"
              >
                Upgrade
                <ArrowUpRight className="h-4 w-4" />
              </button>
            )}
          </div>
          {/* Usage Summary */}
          <div className="space-y-3 mb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Recordings</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Number of screen recordings you can create each month
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {recordingsUsage?.consumed ?? '-'}
                </span>
                /{recordingsUsage?.isUnlimited ? '\u221e' : (recordingsUsage?.quotedLimit ?? '-')}{' '}
                used this month
              </div>
              <Progress value={recordingsUsage?.percentUsed ?? 0} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Seats</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Number of team members who can access this workspace</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{seatsUsage?.consumed ?? '-'}</span>
                /{seatsUsage?.isUnlimited ? '\u221e' : (seatsUsage?.quotedLimit ?? '-')} used
              </div>
              <Progress value={seatsUsage?.percentUsed ?? 0} className="h-2" />
            </div>
          </div>
          {/* Status Alert Banner */}
          {(accessDisplay.message || planDisplay.statusMessage) && (
            <div className="mb-4 p-4 rounded-lg border bg-muted/50 border-border flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {accessDisplay.message || planDisplay.statusMessage}
                </p>
                {(accessDisplay.actionRequired || planDisplay.actionRequired) && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Next step: {accessDisplay.actionRequired || planDisplay.actionRequired}
                  </p>
                )}
              </div>
              {(accessDisplay.actionRequired || planDisplay.actionRequired) && (
                <button
                  onClick={handleManageBilling}
                  disabled={isPortalPending}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md shrink-0 transition-colors bg-primary text-primary-foreground hover:bg-primary/90 ${
                    isPortalPending ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isPortalPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Take Action'}
                </button>
              )}
            </div>
          )}
        </div>

        <PlanSelectionModal onPlanSelect={handlePlanSelect} />

        {subscriptionData && (
          <BillingDetailsModal
            open={showBillingDetails}
            onOpenChange={setShowBillingDetails}
            subscription={{
              planName: subscriptionData.planName || 'Free',
              planId: subscriptionData.planId || 'free',
              status: subscriptionData.status || 'active',
              currentPeriodEnd: subscriptionData.currentPeriodEnd,
              currentPeriodStart: subscriptionData.currentPeriodStart,
              cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
              cancelledAt: subscriptionData.cancelledAt,
              onHoldSince: subscriptionData.onHoldSince,
              accessStatus: subscriptionData.accessStatus,
            }}
            onManagePortal={handleManageBilling}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
