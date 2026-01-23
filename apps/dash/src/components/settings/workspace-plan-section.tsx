'use client';

import { getSlugFromPlanId } from '@workspace/payments';
import type { PlanId, PlanName } from '@workspace/pricing';
import { Button } from '@workspace/ui/components/button';
import { Progress } from '@workspace/ui/components/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { ArrowUpRight, Info, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { PlanUpgradeModal } from '@/components/modals/plan-upgrade-modal';
import { SectionError } from '@/components/shared/section-error';
import { useWorkspace } from '@/hooks/use-workspace';
import { useChangePlan, useSubscriptionStatus } from '@/queries/use-billing-queries';
import { useCreateCheckout } from '@/queries/use-checkout-mutations';

export function WorkspacePlanSection() {
  const { data: workspaceResult, isLoading, error, refetch } = useWorkspace();
  const { data: subscriptionResult } = useSubscriptionStatus();
  const workspaceData = workspaceResult?.success ? workspaceResult.data : null;
  const subscriptionData = subscriptionResult?.success ? subscriptionResult.data : null;
  const planName = (workspaceData?.workspace.workspacePlanName || 'Free') as PlanName;
  const workspaceId = workspaceData?.workspace.workspaceId;

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const { mutate: createCheckout, isPending: isCheckoutPending } = useCreateCheckout();
  const { mutate: changePlan, isPending: isChangePlanPending } = useChangePlan({
    onSuccess: () => {
      setIsUpgradeModalOpen(false);
    },
  });

  const handleUpgrade = (planId: string) => {
    if (!workspaceId) return;

    const slug = getSlugFromPlanId(planId as PlanId);
    if (!slug) {
      console.error('No slug found for plan ID:', planId);
      return;
    }

    // Check if there's an active subscription - use changePlan for upgrades/downgrades
    if (subscriptionData?.hasSubscription && subscriptionData?.status === 'active') {
      changePlan({
        planSlug: slug,
      });
    } else {
      // No active subscription - use checkout for new subscription
      createCheckout({
        planSlug: slug,
        workspaceId,
      });
    }
  };

  const isPending = isCheckoutPending || isChangePlanPending;

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
          <h4 className="text-xl font-semibold mb-4">{planName}</h4>
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
                <span className="font-semibold text-foreground">-</span>/- used this month
              </div>
              <Progress value={0} className="h-2" />
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
                <span className="font-semibold text-foreground">-</span>/- used this month
              </div>
              <Progress value={0} className="h-2" />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Upgrade your team to get instant access to more links
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 h-8"
              onClick={() => setIsUpgradeModalOpen(true)}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Upgrade
                  <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>

        <PlanUpgradeModal
          open={isUpgradeModalOpen}
          onOpenChange={setIsUpgradeModalOpen}
          currentPlanName={planName}
          onUpgrade={handleUpgrade}
          hasActiveSubscription={
            subscriptionData?.hasSubscription && subscriptionData?.status === 'active'
          }
        />
      </div>
    </TooltipProvider>
  );
}
