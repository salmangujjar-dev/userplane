'use client';

import type { PlanId } from '@workspace/pricing';
import { useQueryState } from 'nuqs';

import { PlanChangePreviewModal } from '@/components/modals/plan-change-preview-modal';
import { PlanSelectionModal } from '@/components/modals/plan-selection-modal';
import { useSubscriptionStatus } from '@/features/billing';
import { planChangePreviewParser, planModalParser } from '@/lib/parsers';
import { useWorkspaceId } from '@/stores/workspace';

/**
 * UpsellProvider renders the plan selection and plan change preview modals
 * at the workspace layout level so they're available on all pages,
 * including full-screen views (e.g. recording detail) that skip the sidebar.
 */
export function UpsellProvider({ children }: { children: React.ReactNode }) {
  const workspaceId = useWorkspaceId();
  const [, setPlanModal] = useQueryState('plan-modal', planModalParser);
  const [, setPlanPreview] = useQueryState('plan-preview', planChangePreviewParser);
  const { data: subscriptionResult } = useSubscriptionStatus();

  const subscriptionData = subscriptionResult?.success ? subscriptionResult.data : null;

  const handlePlanSelect = (planId: string) => {
    if (!workspaceId) return;

    // Always open modal - server will route to appropriate flow:
    // - No subscription + owner/admin: checkout
    // - Active subscription + owner/admin: preview + execute
    // - Active subscription + member: request
    setPlanPreview(planId as PlanId);
    setPlanModal(null);
  };

  const handlePlanChangeComplete = () => {
    setPlanPreview(null);
  };

  return (
    <>
      {children}

      <PlanSelectionModal
        onPlanSelect={handlePlanSelect}
        currentPlanName={subscriptionData?.contractDetail.planName ?? null}
      />

      <PlanChangePreviewModal onComplete={handlePlanChangeComplete} />
    </>
  );
}
