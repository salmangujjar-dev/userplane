'use client';

import { type PlanId, type PlanName, UNLIMITED_QUOTED_LIMIT } from '@userplane/pricing';
import Logo from '@userplane/ui/components/logo';
import { Progress } from '@userplane/ui/components/progress';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@userplane/ui/components/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@userplane/ui/components/tooltip';
import { CheckCircle2, FileText, Info, MoveUpRight } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useState } from 'react';

import { BillingDetailsModal } from '@/components/modals/billing-details-modal';
import { SectionError } from '@/components/shared/section-error';
import { useOpenCustomerPortal, useSubscriptionStatus, useUsageSummary } from '@/features/billing';
import { useWorkspace } from '@/features/workspace';
import { planModalParser } from '@/lib/parsers';
import { getPlanDisplay } from '@/lib/plan-display';
import type { ResourceUsage } from '@/types';

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
      className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-accent transition-colors flex items-center gap-2"
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
  const isOverLimit = usage?.limit !== UNLIMITED_QUOTED_LIMIT && (usage?.percentUsed ?? 0) > 100;
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
        /{usage?.limit === UNLIMITED_QUOTED_LIMIT ? '\u221e' : (usage?.limit ?? '-')} {periodLabel}
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

const SECTION_TITLE = 'Workspace Plan';
const SECTION_DESCRIPTION = 'Manage your workspace subscription and plan details';

function PlanSectionHeader() {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold">{SECTION_TITLE}</h2>
      <p className="text-sm text-muted-foreground">{SECTION_DESCRIPTION}</p>
    </div>
  );
}

function UsageMetricSkeletonRows({
  count = 4,
  keyPrefix = 'usage',
}: {
  count?: number;
  keyPrefix?: string;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={`${keyPrefix}-skeleton-${i}`} className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-[18px] w-20 bg-muted animate-pulse rounded" />
            <div className="h-4 w-4 bg-muted animate-pulse rounded-full" />
          </div>
          <div className="h-[18px] w-28 bg-muted animate-pulse rounded" />
          <div className="h-2 w-full bg-muted animate-pulse rounded-full" />
        </div>
      ))}
    </>
  );
}

function PlanSectionSkeleton() {
  return (
    <TooltipProvider>
      <div>
        <PlanSectionHeader />
        <div className="max-w-2xl rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-7 w-24 bg-muted animate-pulse rounded" />
            <div className="h-9 w-[110px] bg-muted animate-pulse rounded-lg" />
          </div>
          <div className="space-y-3 mb-4">
            <UsageMetricSkeletonRows />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

interface UsageMetricsGridProps {
  isLoading: boolean;
  resources: [string, import('@/types').ResourceUsage][];
  resourceMetadata: Record<string, { label: string; description: string; periodLabel?: string }>;
}

function UsageMetricsGrid({ isLoading, resources, resourceMetadata }: UsageMetricsGridProps) {
  return (
    <div className="space-y-3 mb-4">
      {isLoading ? (
        <UsageMetricSkeletonRows keyPrefix="metric" />
      ) : (
        resources.map(([resourceType, usage]) => {
          const metadata = resourceMetadata[resourceType];
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
  );
}

interface ContactAdminSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ContactAdminSheet({ open, onOpenChange }: ContactAdminSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="p-0 gap-0 max-h-[85vh] overflow-y-auto rounded-t-2xl"
        showCloseButton={true}
      >
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <SheetTitle className="text-xl font-semibold">Admin Access Required</SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                Only workspace owners and admins can manage billing settings
              </SheetDescription>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="max-w-md mx-auto space-y-6">
            <div className="space-y-4">
              <p className="text-sm font-medium">How to proceed</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Ask a workspace owner or admin to manage billing
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    They can update the plan from workspace billing settings
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenChange(false)}
              className="w-full px-6 py-3 text-sm font-medium rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function WorkspacePlanSection() {
  const { data: workspaceResult, isLoading: isLoadingWorkspace, error, refetch } = useWorkspace();
  const { data: subscriptionResult, isLoading: isLoadingSubscription } = useSubscriptionStatus();
  const { data: usageResult, isLoading: isLoadingUsage } = useUsageSummary();
  const subscriptionData = subscriptionResult?.success ? subscriptionResult.data : null;
  const usageData = usageResult?.success ? usageResult.data : null;
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

    if (
      subscriptionData.contractDetail.status === 'on_hold' &&
      subscriptionData.contractDetail.onHoldSince
    ) {
      // 14-day grace period from onHoldSince
      const graceEndsAt = new Date(
        subscriptionData.contractDetail.onHoldSince.getTime() + 14 * 24 * 60 * 60 * 1000
      );
      return Math.max(
        0,
        Math.ceil((graceEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      );
    }

    if (
      subscriptionData.contractDetail.status === 'cancelled' &&
      subscriptionData.contractDetail.cancelAtPeriodEnd &&
      subscriptionData.contractDetail.currentPeriodEnd
    ) {
      return Math.max(
        0,
        Math.ceil(
          (subscriptionData.contractDetail.currentPeriodEnd.getTime() - now.getTime()) /
            (24 * 60 * 60 * 1000)
        )
      );
    }

    return undefined;
  };

  // Get plan display based on subscription status
  const planDisplay = getPlanDisplay(
    subscriptionData?.contractDetail.planName ?? null,
    subscriptionData?.contractDetail.status ?? null,
    subscriptionData?.contractDetail.cancelAtPeriodEnd,
    calculateDaysRemaining(),
    subscriptionData?.contractDetail.trialEnd
  );

  const [, setPlanModal] = useQueryState('plan-modal', planModalParser);
  const [showBillingDetails, setShowBillingDetails] = useState(false);
  const [showContactAdmin, setShowContactAdmin] = useState(false);

  const { mutate: openCustomerPortal, isPending: isPortalPending } = useOpenCustomerPortal({
    onPermissionDenied: () => setShowContactAdmin(true),
  });

  const handleManageBilling = () => {
    openCustomerPortal();
  };

  /**
   * Handle opening plan selection modal
   * Shows detailed mode (all plans) if no subscription, suggested mode otherwise
   */
  const handleShowPlanPortal = () => {
    const accessStatus = subscriptionData?.accessDetail.accessStatus;
    const hasActiveSubscription =
      subscriptionData?.contractDetail.planId &&
      (accessStatus === 'active' || accessStatus === 'trial');

    // No subscription → show all plans (detailed mode)
    // Has subscription → show suggested upgrade plans
    setPlanModal(hasActiveSubscription ? 'suggested' : 'detailed');
  };

  // Initial loading state (workspace not yet loaded)
  if (isLoadingWorkspace) {
    return <PlanSectionSkeleton />;
  }

  if (error || (workspaceResult && !workspaceResult.success)) {
    return (
      <div>
        <PlanSectionHeader />
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
        <PlanSectionHeader />
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
              hasPlanId={!!subscriptionData?.contractDetail.planId}
              accessStatus={subscriptionData?.accessDetail.accessStatus}
              onShowBillingDetails={() => setShowBillingDetails(true)}
              onShowPlanPortal={handleShowPlanPortal}
            />
          )}

          {/* Progressive usage metrics loading */}
          <UsageMetricsGrid
            isLoading={isLoadingUsage}
            resources={resources}
            resourceMetadata={RESOURCE_METADATA}
          />
        </div>

        {subscriptionData &&
          subscriptionData.contractDetail.planName &&
          subscriptionData.contractDetail.planId &&
          subscriptionData.contractDetail.status && (
            <BillingDetailsModal
              open={showBillingDetails}
              onOpenChange={setShowBillingDetails}
              subscription={{
                planName: subscriptionData.contractDetail.planName as PlanName,
                planId: subscriptionData.contractDetail.planId as PlanId,
                status: subscriptionData.contractDetail.status,
                currentPeriodEnd: subscriptionData.contractDetail.currentPeriodEnd,
                currentPeriodStart: subscriptionData.contractDetail.currentPeriodStart,
                cancelAtPeriodEnd: subscriptionData.contractDetail.cancelAtPeriodEnd,
                cancelledAt: subscriptionData.contractDetail.cancelledAt,
                onHoldSince: subscriptionData.contractDetail.onHoldSince,
                trialEnd: subscriptionData.contractDetail.trialEnd,
                accessStatus: subscriptionData.accessDetail,
              }}
              onManagePortal={handleManageBilling}
              onUpgradePlan={() => setPlanModal('suggested')}
              isPortalLoading={isPortalPending}
              usage={resources.map(([resourceType, resourceUsage]) => ({
                label: RESOURCE_METADATA[resourceType]?.label ?? resourceType,
                usage: resourceUsage,
              }))}
            />
          )}

        <ContactAdminSheet open={showContactAdmin} onOpenChange={setShowContactAdmin} />
      </div>
    </TooltipProvider>
  );
}
