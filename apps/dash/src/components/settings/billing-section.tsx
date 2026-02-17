'use client';

import { Label } from '@workspace/ui/components/label';
import { CreditCard, Loader2, MoveUpRight } from 'lucide-react';
import { useQueryState } from 'nuqs';

import { useOpenCustomerPortal, useSubscriptionStatus } from '@/features/billing';
import { useCanEditWorkspace } from '@/features/workspace';
import { planModalParser } from '@/lib/parsers';

export function BillingSection() {
  const { data: subscriptionResult } = useSubscriptionStatus();
  const { canEdit } = useCanEditWorkspace();

  const subscriptionData = subscriptionResult?.success ? subscriptionResult.data : null;
  // Infer subscription status from contractDetail.planId
  const hasSubscription = subscriptionData?.contractDetail.planId !== null;

  const { mutate: openCustomerPortal, isPending: isPortalPending } = useOpenCustomerPortal();
  const [, setPlanModal] = useQueryState('plan-modal', planModalParser);

  const handleManageBilling = () => {
    openCustomerPortal();
  };

  if (!hasSubscription || !canEdit) return null;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Billing</h2>
        <p className="text-sm text-muted-foreground">Manage billing and payment settings</p>
      </div>
      <div className="max-w-2xl space-y-6">
        {/* Manage Billing Section */}
        <div className="space-y-3">
          <div>
            <Label>Manage billing</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Update payment methods, view billing history, or change your plan
            </p>
          </div>
          <div className="flex gap-3 max-w-md">
            <button
              onClick={handleManageBilling}
              disabled={isPortalPending}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed bg-background hover:bg-muted/50 transition-colors ${
                isPortalPending
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:border-primary/50'
              }`}
            >
              {isPortalPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Manage billing</span>
                </>
              )}
            </button>
            <button
              onClick={() => setPlanModal('suggested')}
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed bg-background hover:bg-muted/50 transition-colors cursor-pointer hover:border-primary/50"
            >
              <MoveUpRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Upgrade plan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
