'use client';

import { getSlugFromPlanId } from '@workspace/payments';
import type { PlanId, PlanName } from '@workspace/pricing';
import { Progress } from '@workspace/ui/components/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { Info } from 'lucide-react';
import { useState } from 'react';

import { PlanSelectionModal } from '@/components/modals/plan-selection-modal';
import { SectionError } from '@/components/shared/section-error';
import { useWorkspace } from '@/hooks/use-workspace';
import { useSubscriptionStatus } from '@/queries/use-billing-queries';
import { useCreateCheckout } from '@/queries/use-checkout-mutations';

export function WorkspacePlanSection() {
  const { data: workspaceResult, isLoading, error, refetch } = useWorkspace();
  const { data: subscriptionResult } = useSubscriptionStatus();
  const workspaceData = workspaceResult?.success ? workspaceResult.data : null;
  const subscriptionData = subscriptionResult?.success ? subscriptionResult.data : null;
  const planName = (workspaceData?.workspace.workspacePlanName || 'Free') as PlanName;
  const workspaceId = workspaceData?.workspace.workspaceId;

  const [showPlanModal, setShowPlanModal] = useState(false);

  const { mutate: createCheckout, isPending: isCheckoutPending } = useCreateCheckout();

  const hasActiveSubscription =
    subscriptionData?.hasSubscription && subscriptionData?.status === 'active';

  const handlePlanSelect = (planId: string) => {
    if (!workspaceId) return;

    const slug = getSlugFromPlanId(planId as PlanId);
    if (!slug) {
      console.error('No slug found for plan ID:', planId);
      return;
    }

    // Create checkout with selected plan
    createCheckout({
      planSlug: slug,
      workspaceId,
    });

    setShowPlanModal(false);
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
        </div>

        <PlanSelectionModal
          open={showPlanModal}
          onOpenChange={setShowPlanModal}
          onPlanSelect={handlePlanSelect}
        />
      </div>
    </TooltipProvider>
  );
}
