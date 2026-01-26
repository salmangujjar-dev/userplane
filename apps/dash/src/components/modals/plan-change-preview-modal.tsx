'use client';

import type { PlanChangePreviewData } from '@workspace/contract';
import type { PlanId } from '@workspace/pricing';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import Logo from '@workspace/ui/components/logo';
import { ArrowRight, CreditCard, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import {
  useChangePlan,
  useOpenCustomerPortal,
  usePreviewPlanChange,
} from '@/queries/use-checkout-mutations';
import { useWorkspaceId } from '@/stores/workspace';

type ModalState = 'loading' | 'preview' | 'confirming' | 'success' | 'error';

interface PlanChangePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newPlanId: PlanId | null;
  onComplete?: () => void;
}

function PreviewView({
  preview,
  isConfirming,
  onConfirm,
  onCancel,
}: {
  preview: PlanChangePreviewData;
  isConfirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Logo variant="tiled" size="md" showText={false} />
        <div className="flex flex-col space-y-1">
          <DialogTitle className="text-xl font-semibold">
            {preview.isUpgrade ? 'Upgrade Your Plan' : 'Change Your Plan'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Review the details of your plan change
          </DialogDescription>
        </div>
      </div>

      {/* Plan Change Summary */}
      <div className="flex items-center justify-center gap-4 py-4">
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Current Plan</div>
          <div className="text-lg font-semibold">{preview.currentPlan.planName}</div>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
        <div className="text-center">
          <div className="text-sm text-muted-foreground">New Plan</div>
          <div className="text-lg font-semibold text-primary">{preview.newPlan.planName}</div>
          <div className="text-xs text-muted-foreground capitalize">
            {preview.newPlan.billingInterval}
          </div>
        </div>
      </div>

      {/* Pricing Details */}
      <div className="space-y-3">
        {preview.isUpgrade && preview.immediateCharge && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Due Today</span>
              </div>
              <span className="text-lg font-semibold">
                {preview.immediateCharge.currency} {preview.immediateCharge.total.toFixed(2)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{preview.immediateCharge.summary}</p>
          </div>
        )}

        {!preview.isUpgrade && preview.creditAmount && (
          <div className="rounded-lg border bg-green-50 dark:bg-green-950/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Credit Applied
                </span>
              </div>
              <span className="text-lg font-semibold text-green-800 dark:text-green-200">
                {preview.creditAmount.currency} {preview.creditAmount.amount.toFixed(2)}
              </span>
            </div>
            <p className="mt-1 text-xs text-green-700 dark:text-green-300">
              {preview.creditAmount.summary}
            </p>
          </div>
        )}

        {!preview.isUpgrade && !preview.creditAmount && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground text-center">
              Your plan change will take effect immediately.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isConfirming}
          className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-accent transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isConfirming}
          className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isConfirming && <Loader2 className="h-4 w-4 animate-spin" />}
          {preview.isUpgrade ? 'Confirm Upgrade' : 'Confirm Change'}
        </button>
      </div>
    </div>
  );
}

function SuccessView({
  newPlanName,
  onClose,
  onOpenPortal,
  isPortalLoading,
}: {
  newPlanName: string;
  onClose: () => void;
  onOpenPortal: () => void;
  isPortalLoading: boolean;
}) {
  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Logo variant="tiled" size="md" showText={false} />
        <div className="flex flex-col space-y-1">
          <DialogTitle className="text-xl font-semibold">Plan Change Processing</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Your plan change request has been submitted
          </DialogDescription>
        </div>
      </div>

      {/* Pending Content */}
      <div className="flex flex-col items-center py-6">
        <Image src="/assets/dino.svg" alt="Processing" width={120} height={120} className="mb-4" />
        <h3 className="text-lg font-semibold mb-2">Switching to {newPlanName}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs mb-4">
          Your plan change is being processed. This usually completes within a few minutes.
        </p>
        <div className="rounded-lg border bg-muted/30 p-3 w-full">
          <p className="text-xs text-muted-foreground text-center">
            You can track the status and manage your subscription in the customer portal.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={onOpenPortal}
          disabled={isPortalLoading}
          className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPortalLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
          Open Customer Portal
        </button>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-accent transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function LoadingView() {
  return (
    <div className="space-y-6 py-4">
      <div className="flex items-start gap-4">
        <Logo variant="tiled" size="md" showText={false} />
        <div className="flex flex-col space-y-1">
          <DialogTitle className="text-xl font-semibold">Loading Preview</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Calculating your plan change details...
          </DialogDescription>
        </div>
      </div>
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}

function ErrorView({
  error,
  onClose,
  onOpenPortal,
  isPortalLoading,
}: {
  error: { message: string; code?: string; data?: { code?: string; message?: string } };
  onClose: () => void;
  onOpenPortal: () => void;
  isPortalLoading: boolean;
}) {
  const errorMessage = error.data?.message || error.message;
  const errorCode = error.data?.code || error.code;

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-start gap-4">
        <Logo variant="tiled" size="md" showText={false} />
        <div className="flex flex-col space-y-1">
          <DialogTitle className="text-xl font-semibold">Unable to Change Plan</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {errorMessage || (errorCode && `Error: ${errorCode}`) || 'An unexpected error occurred'}
          </DialogDescription>
        </div>
      </div>

      {/* Dino */}
      <div className="flex justify-center py-6">
        <Image src="/assets/dino.svg" alt="Error" width={120} height={120} />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={onOpenPortal}
          disabled={isPortalLoading}
          className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPortalLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
          Open Customer Portal
        </button>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-accent transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export function PlanChangePreviewModal({
  open,
  onOpenChange,
  newPlanId,
  onComplete,
}: PlanChangePreviewModalProps) {
  const workspaceId = useWorkspaceId();
  const [modalState, setModalState] = useState<ModalState>('loading');
  const [previewData, setPreviewData] = useState<PlanChangePreviewData | null>(null);
  const [errorInfo, setErrorInfo] = useState<{
    message: string;
    code?: string;
    data?: { code?: string; message?: string };
  }>({ message: '' });
  const [completedPlanName, setCompletedPlanName] = useState<string>('');

  const { mutate: previewPlanChange } = usePreviewPlanChange({
    onSuccess: (data) => {
      setPreviewData(data);
      setModalState('preview');
    },
    onError: (error) => {
      // Extract structured error data if available (from UPSTREAM_PAYMENT_ERROR)
      const errorData = (error as { data?: { code?: string; message?: string } }).data;
      const errorCode = (error as { code?: string }).code;
      setErrorInfo({
        message: error.message,
        code: errorCode,
        data: errorData,
      });
      setModalState('error');
    },
  });

  const { mutate: changePlan } = useChangePlan({
    onSuccess: (data) => {
      setCompletedPlanName(data.newPlanName);
      setModalState('success');
    },
    onError: (error) => {
      // Extract structured error data if available (from UPSTREAM_PAYMENT_ERROR)
      const errorData = (error as { data?: { code?: string; message?: string } }).data;
      const errorCode = (error as { code?: string }).code;
      setErrorInfo({
        message: error.message,
        code: errorCode,
        data: errorData,
      });
      setModalState('error');
    },
  });

  const { mutate: openCustomerPortal, isPending: isPortalLoading } = useOpenCustomerPortal();

  // Fetch preview when modal opens with a new plan
  useEffect(() => {
    if (open && newPlanId && workspaceId) {
      setModalState('loading');
      setPreviewData(null);
      setErrorInfo({ message: '' });
      previewPlanChange({ planId: newPlanId, workspaceId });
    }
  }, [open, newPlanId, workspaceId, previewPlanChange]);

  const handleConfirm = () => {
    if (!newPlanId || !workspaceId) return;
    setModalState('confirming');
    changePlan({ planId: newPlanId, workspaceId });
  };

  const handleClose = () => {
    onOpenChange(false);
    if (modalState === 'success') {
      onComplete?.();
    }
    // Reset state after modal closes
    setTimeout(() => {
      setModalState('loading');
      setPreviewData(null);
      setErrorInfo({ message: '' });
      setCompletedPlanName('');
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        {modalState === 'loading' && <LoadingView />}
        {modalState === 'preview' && previewData && (
          <PreviewView
            preview={previewData}
            isConfirming={false}
            onConfirm={handleConfirm}
            onCancel={handleClose}
          />
        )}
        {modalState === 'confirming' && previewData && (
          <PreviewView
            preview={previewData}
            isConfirming={true}
            onConfirm={handleConfirm}
            onCancel={handleClose}
          />
        )}
        {modalState === 'success' && (
          <SuccessView
            newPlanName={completedPlanName}
            onClose={handleClose}
            onOpenPortal={() => openCustomerPortal()}
            isPortalLoading={isPortalLoading}
          />
        )}
        {modalState === 'error' && (
          <ErrorView
            error={errorInfo}
            onClose={handleClose}
            onOpenPortal={() => openCustomerPortal()}
            isPortalLoading={isPortalLoading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
