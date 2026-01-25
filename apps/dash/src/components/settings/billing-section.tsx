'use client';

import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { CreditCard, Loader2, Mail } from 'lucide-react';
import { useState } from 'react';

import { BillingEmailVerificationModal } from '@/components/modals/billing-email-verification-modal';
import { useWorkspaceBillingEmail } from '@/hooks/use-workspace-billing-email';
import { useCanEditWorkspace } from '@/hooks/use-workspace-role';
import { useRequestBillingEmailChange } from '@/queries/use-billing-email-verification-mutations';
import { useSubscriptionStatus } from '@/queries/use-billing-queries';
import { useOpenCustomerPortal } from '@/queries/use-checkout-mutations';
import { useWorkspaceId } from '@/stores/workspace';

export function BillingSection() {
  const workspaceId = useWorkspaceId();
  const { data: billingEmailResult, isLoading: isLoadingBilling } = useWorkspaceBillingEmail();
  const { data: subscriptionResult } = useSubscriptionStatus();
  const { canEdit } = useCanEditWorkspace();
  const [showBillingModal, setShowBillingModal] = useState(false);

  const originalBillingEmail = billingEmailResult?.success
    ? billingEmailResult.data.workspaceBillingEmail || ''
    : '';

  const subscriptionData = subscriptionResult?.success ? subscriptionResult.data : null;
  // Infer subscription status from contractDetail.planId
  const hasSubscription = subscriptionData?.contractDetail.planId !== null;

  const { mutate: openCustomerPortal, isPending: isPortalPending } = useOpenCustomerPortal();

  const requestBillingEmailChangeMutation = useRequestBillingEmailChange({
    onSuccess: () => {
      // Keep modal open to show success message
    },
  });

  const handleRequestBillingEmailChange = async (email: string) => {
    if (!workspaceId) return;

    const result = await requestBillingEmailChangeMutation.mutateAsync({
      workspaceId,
      email,
    });

    if (!result.success) {
      throw new Error('Failed to send verification email');
    }
  };

  const handleManageBilling = () => {
    openCustomerPortal();
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Billing</h2>
        <p className="text-sm text-muted-foreground">Manage billing and payment settings</p>
      </div>
      <div className="max-w-2xl space-y-6">
        {/* Manage Billing Section */}
        {hasSubscription && canEdit && (
          <div className="space-y-3">
            <div>
              <Label>Manage billing</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Update payment methods, view billing history, or change your plan
              </p>
            </div>
            <button
              onClick={handleManageBilling}
              disabled={isPortalPending}
              className={`w-full max-w-md flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed bg-background hover:bg-muted/50 transition-colors ${
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
          </div>
        )}

        {/* Billing Email Section */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="billing-email">Billing Email</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Invoices and billing related notifications will be sent to this email
            </p>
          </div>
          {isLoadingBilling ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-10 w-full max-w-md" />
              <Skeleton className="h-16 w-full max-w-md" />
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                id="billing-email"
                type="email"
                value={originalBillingEmail || 'Not set'}
                className="max-w-md bg-muted"
                disabled
              />
              {canEdit && (
                <button
                  onClick={() => setShowBillingModal(true)}
                  disabled={requestBillingEmailChangeMutation.isPending}
                  className={`w-full max-w-md flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed bg-background hover:bg-muted/50 transition-colors ${
                    requestBillingEmailChangeMutation.isPending
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer hover:border-primary/50'
                  }`}
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Update billing email</span>
                </button>
              )}
            </div>
          )}
        </div>

        <BillingEmailVerificationModal
          open={showBillingModal}
          onOpenChange={setShowBillingModal}
          currentEmail={originalBillingEmail}
          onRequestChange={handleRequestBillingEmailChange}
          isLoading={requestBillingEmailChangeMutation.isPending}
        />
      </div>
    </div>
  );
}
