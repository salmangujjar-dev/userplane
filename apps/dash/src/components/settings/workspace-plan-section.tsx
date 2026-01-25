'use client';

import type { ResourceUsage } from '@workspace/contract';
import type { PlanId, PlanName } from '@workspace/pricing';
import { Progress } from '@workspace/ui/components/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { FileText, Info, MoveUpRight } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useState } from 'react';

import { BillingDetailsModal } from '@/components/modals/billing-details-modal';
import { PlanSelectionModal } from '@/components/modals/plan-selection-modal';
import { SectionError } from '@/components/shared/section-error';
import { useWorkspace } from '@/hooks/use-workspace';
import { planModalParser } from '@/lib/parsers';
import { getPlanDisplay } from '@/lib/plan-display';
import { useSubscriptionStatus, useUsageSummary } from '@/queries/use-billing-queries';
import { useCreateCheckout, useOpenCustomerPortal } from '@/queries/use-checkout-mutations';

interface BillingActionButtonProps {
  hasPlanId: boolean;
  accessStatus?: string;
  onShowBillingDetails: () => void;
  onShowPlanPortal: () => void;
}

function BillingActionButton({
  hasPlanId,
  accessStatus,
  onShowBillingDetails,
  onShowPlanPortal,
}: BillingActionButtonProps) {
  const shouldShowUpgrade = !hasPlanId || (hasPlanId && accessStatus === 'inactive');

  const handleClick = () => {
    if (shouldShowUpgrade) {
      onShowPlanPortal();
    } else {
      onShowBillingDetails();
    }
  };

  const Icon = shouldShowUpgrade ? MoveUpRight : FileText;

  return (
    <button
      onClick={handleClick}
      className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-accent transition-colors flex items-center gap-2"
    >
      <Icon className="h-4 w-4" />
      {shouldShowUpgrade ? 'Upgrade Plan' : 'Review Plan'}
    </button>
  );
}

interface PlanHeaderProps {
  planName: string;
  statusMessage?: string;
  isUrgent: boolean;
  hasPlanId: boolean;
  accessStatus?: string;
  onShowBillingDetails: () => void;
  onShowPlanPortal: () => void;
}

function PlanHeader({
  planName,
  statusMessage,
  isUrgent,
  hasPlanId,
  accessStatus,
  onShowBillingDetails,
  onShowPlanPortal,
}: PlanHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h4 className="text-xl font-semibold">{planName}</h4>
        {statusMessage && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={`transition-colors ${
                  isUrgent
                    ? 'text-yellow-600 hover:text-yellow-700'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Info className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{statusMessage}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <BillingActionButton
        hasPlanId={hasPlanId}
        accessStatus={accessStatus}
        onShowBillingDetails={onShowBillingDetails}
        onShowPlanPortal={onShowPlanPortal}
      />
    </div>
  );
}

interface UsageMetricProps {
  name: string;
  description: string;
  usage: ResourceUsage | undefined;
  periodLabel?: string;
}

function UsageMetric({ name, description, usage, periodLabel = 'used' }: UsageMetricProps) {
  const isOverLimit = usage?.limit !== -1 && (usage?.percentUsed ?? 0) > 100;
  const displayPercent = Math.min(100, usage?.percentUsed ?? 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{name}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{description}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="text-sm text-muted-foreground">
        <span className={`font-semibold ${isOverLimit ? 'text-red-600' : 'text-foreground'}`}>
          {usage?.consumed ?? '-'}
        </span>
        /{usage?.limit === -1 ? '\u221e' : (usage?.limit ?? '-')} {periodLabel}
      </div>
      <Progress
        value={displayPercent}
        className={`h-2 ${isOverLimit ? '[&>div]:bg-red-600' : ''}`}
      />
      {isOverLimit && (
        <div className="text-xs text-muted-foreground pt-1">
          You&apos;ve exceeded your {name.toLowerCase()} limit.
        </div>
      )}
    </div>
  );
}

export function WorkspacePlanSection() {
  const { data: workspaceResult, isLoading: isLoadingWorkspace, error, refetch } = useWorkspace();
  const { data: subscriptionResult, isLoading: isLoadingSubscription } = useSubscriptionStatus();
  const { data: usageResult, isLoading: isLoadingUsage } = useUsageSummary();
  const workspaceData = workspaceResult?.success ? workspaceResult.data : null;
  const subscriptionData = subscriptionResult?.success ? subscriptionResult.data : null;
  const usageData = usageResult?.success ? usageResult.data : null;
  const workspaceId = workspaceData?.workspace?.workspaceId;

  // Resource metadata for user-facing display (internal resources like logs, files hidden)
  const RESOURCE_METADATA: Record<
    string,
    { label: string; description: string; periodLabel?: string }
  > = {
    seats: {
      label: 'Seats',
      description: 'Team members with workspace access',
    },
    links: {
      label: 'Links',
      description: 'Shareable links you can create',
    },
    recordings: {
      label: 'Recordings',
      description: 'Screen recordings you can create each month',
      periodLabel: 'used this month',
    },
    screenshots: {
      label: 'Screenshots',
      description: 'Screenshots you can capture',
    },
  };

  // Get user-facing resources and filter out ones with 0 limit
  const resources = usageData?.resources
    ? Object.entries(usageData.resources).filter(
        ([resourceType, usage]) => RESOURCE_METADATA[resourceType] && usage.limit !== 0
      )
    : [];

  // Calculate daysRemaining from subscription data
  const calculateDaysRemaining = (): number | undefined => {
    if (!subscriptionData) return undefined;
    const now = new Date();

    if (subscriptionData.status === 'on_hold' && subscriptionData.onHoldSince) {
      // 14-day grace period from onHoldSince
      const graceEndsAt = new Date(
        new Date(subscriptionData.onHoldSince).getTime() + 14 * 24 * 60 * 60 * 1000
      );
      return Math.max(
        0,
        Math.ceil((graceEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      );
    }

    if (
      subscriptionData.status === 'cancelled' &&
      subscriptionData.cancelAtPeriodEnd &&
      subscriptionData.currentPeriodEnd
    ) {
      const periodEnd = new Date(subscriptionData.currentPeriodEnd);
      return Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
    }

    return undefined;
  };

  // Get plan display based on subscription status
  const planDisplay = getPlanDisplay(
    subscriptionData?.planName ?? null,
    subscriptionData?.status ?? null,
    subscriptionData?.cancelAtPeriodEnd,
    calculateDaysRemaining()
  );

  const [, setPlanModal] = useQueryState('plan-modal', planModalParser);
  const [showBillingDetails, setShowBillingDetails] = useState(false);

  const { mutate: createCheckout } = useCreateCheckout();
  const { mutate: openCustomerPortal, isPending: isPortalPending } = useOpenCustomerPortal();

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

  // Initial loading state (workspace not yet loaded)
  if (isLoadingWorkspace) {
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
            <div className="flex items-center justify-between mb-4">
              <div className="h-7 w-24 bg-muted animate-pulse rounded" />
              <div className="h-9 w-[110px] bg-muted animate-pulse rounded-lg" />
            </div>
            <div className="space-y-3 mb-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-[18px] w-20 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-4 bg-muted animate-pulse rounded-full" />
                  </div>
                  <div className="h-[18px] w-28 bg-muted animate-pulse rounded" />
                  <div className="h-2 w-full bg-muted animate-pulse rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </TooltipProvider>
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
          {/* Progressive header loading */}
          {isLoadingSubscription ? (
            <div className="flex items-center justify-between mb-4">
              <div className="h-7 w-24 bg-muted animate-pulse rounded" />
              <div className="h-9 w-[110px] bg-muted animate-pulse rounded-lg" />
            </div>
          ) : (
            <PlanHeader
              planName={planDisplay.displayName}
              statusMessage={planDisplay.statusMessage}
              isUrgent={planDisplay.isUrgent ?? false}
              hasPlanId={!!subscriptionData?.planId}
              accessStatus={subscriptionData?.accessStatus.accessStatus}
              onShowBillingDetails={() => setShowBillingDetails(true)}
              onShowPlanPortal={() => setPlanModal('suggested')}
            />
          )}

          {/* Progressive usage metrics loading */}
          <div className="space-y-3 mb-4">
            {isLoadingUsage ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-[18px] w-20 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-4 bg-muted animate-pulse rounded-full" />
                    </div>
                    <div className="h-[18px] w-28 bg-muted animate-pulse rounded" />
                    <div className="h-2 w-full bg-muted animate-pulse rounded-full" />
                  </div>
                ))}
              </>
            ) : (
              resources.map(([resourceType, usage]) => {
                const metadata = RESOURCE_METADATA[resourceType];
                if (!metadata) return null;

                return (
                  <UsageMetric
                    key={resourceType}
                    name={metadata.label}
                    description={metadata.description}
                    usage={usage}
                    periodLabel={metadata.periodLabel}
                  />
                );
              })
            )}
          </div>
        </div>

        <PlanSelectionModal onPlanSelect={handlePlanSelect} />

        {subscriptionData &&
          subscriptionData.planName &&
          subscriptionData.planId &&
          subscriptionData.status && (
            <BillingDetailsModal
              open={showBillingDetails}
              onOpenChange={setShowBillingDetails}
              subscription={{
                planName: subscriptionData.planName as PlanName,
                planId: subscriptionData.planId as PlanId,
                status: subscriptionData.status,
                currentPeriodEnd: subscriptionData.currentPeriodEnd,
                currentPeriodStart: subscriptionData.currentPeriodStart,
                cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
                cancelledAt: subscriptionData.cancelledAt,
                onHoldSince: subscriptionData.onHoldSince,
                accessStatus: subscriptionData.accessStatus,
              }}
              onManagePortal={handleManageBilling}
              isPortalLoading={isPortalPending}
            />
          )}
      </div>
    </TooltipProvider>
  );
}
