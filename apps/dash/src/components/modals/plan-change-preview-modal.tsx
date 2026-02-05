'use client';

import type { PlanId } from '@workspace/pricing';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import Logo from '@workspace/ui/components/logo';
import { ArrowLeftRight, CheckCircle2, ExternalLink, Loader2, Mail, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { authClient } from '@/client/auth';
import { env } from '@/env';
import { useManagePlan, useOpenCustomerPortal } from '@/features/billing';
import { mediaClient } from '@/lib/media';
import { useWorkspaceId } from '@/stores/workspace';
import type { PlanChangePreviewData } from '@/types';

type ModalState =
  | 'loading'
  | 'preview'
  | 'confirming'
  | 'success'
  | 'error'
  | 'request-sent'
  | 'checkout';

type PredictedFlow = 'checkout' | 'preview' | 'request' | 'unknown';

interface PlanChangePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newPlanId: PlanId | null;
  onComplete?: () => void;
  predictedFlow?: PredictedFlow;
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
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  type LineItem = NonNullable<typeof preview.immediateCharge>['lineItems'][0];

  const getLineItemName = (item: LineItem) => {
    if (item.prorationFactor) {
      return `${item.name} (Prorated)`;
    }
    return item.name;
  };

  const getLineItemAmount = (item: LineItem) => {
    return item.unitPrice * item.quantity;
  };

  if (!preview.immediateCharge) {
    return (
      <div className="space-y-6 py-4">
        <div className="flex items-start gap-4">
          <Logo variant="tiled" size="md" showText={false} />
          <div className="flex flex-col space-y-1">
            <DialogTitle className="text-xl font-semibold">Change Your Plan</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Review the details of your plan change
            </DialogDescription>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground text-center">
            Your plan change will take effect immediately.
          </p>
        </div>

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
            Confirm Change
          </button>
        </div>
      </div>
    );
  }

  const { currency } = preview.immediateCharge.chargeSummary;
  const { lineItems, chargeSummary } = preview.immediateCharge;

  return (
    <div className="px-6 pb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Panel */}
        <div className="flex flex-col h-full md:col-span-1">
          {/* Header with Back Button */}
          <div className="flex items-center gap-2 mb-8 pt-6">
            <button
              onClick={onCancel}
              disabled={isConfirming}
              className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              aria-label="Go back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <h3 className="text-base font-semibold text-foreground">
              {preview.isUpgrade ? 'Review your upgrade' : 'Review your plan change'}
            </h3>
          </div>

          {/* Plan & Billing Info */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-600">Plan</span>
              <span className="text-sm text-foreground font-semibold">
                {preview.newPlan.planName}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-600">Billing</span>
              <span className="text-sm text-foreground font-semibold capitalize">
                {preview.newPlan.billingInterval}
              </span>
            </div>
          </div>

          {/* Spacer to push content to bottom */}
          <div className="flex-1" />

          {/* How Your Upgrade Works */}
          <div className="pb-6">
            <h4 className="text-base font-semibold text-foreground mb-4">
              {preview.isUpgrade ? 'How your upgrade works' : 'How your plan change works'}
            </h4>

            <div className="relative space-y-4">
              {/* Timeline connector line */}
              <div className="absolute left-1.5 top-6 bottom-6 w-px bg-zinc-200" />

              {/* Today */}
              <div className="relative flex items-start gap-3">
                <div className="relative z-10 w-3 h-3 rounded-full bg-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground mb-1">Today</div>
                  <div className="text-xs text-zinc-600 leading-relaxed">
                    Your plan changes immediately. You&apos;ll be charged a prorated amount based on
                    your remaining billing period.
                  </div>
                </div>
              </div>

              {/* Next Billing Date */}
              <div className="relative flex items-start gap-3">
                <div className="relative z-10 w-3 h-3 rounded-full bg-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground mb-1">
                    Next Billing Date
                  </div>
                  <div className="text-xs text-zinc-600 leading-relaxed">
                    Starting{' '}
                    <span className="font-semibold text-foreground">
                      {formatDate(preview.newPlan.nextBillingDate)}
                    </span>
                    , you&apos;ll be charged{' '}
                    <span className="font-semibold text-foreground">
                      {formatCurrency(preview.newPlan.recurringPreTaxAmount, currency)}
                    </span>{' '}
                    per {preview.newPlan.paymentFrequencyInterval.toLowerCase()}.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col pt-6 md:col-span-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col h-full">
            {/* Amount Due Today */}
            <div className="text-center pb-6 mb-6 border-b border-zinc-100">
              <div className="text-sm text-zinc-600 mb-3">Amount due today</div>
              <div className="text-4xl font-bold text-foreground">
                {formatCurrency(chargeSummary.totalAmount, currency)}
              </div>
            </div>

            {/* Proration Details */}
            <div className="mb-6">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                Proration Details
              </div>
              <div className="space-y-3">
                {lineItems.map((item, i) => (
                  <div key={i} className="flex justify-between items-start">
                    <span className="text-sm text-zinc-700">{getLineItemName(item)}</span>
                    <span className="text-sm font-semibold text-foreground ml-4 text-right">
                      {formatCurrency(getLineItemAmount(item), currency)}
                    </span>
                  </div>
                ))}
                {chargeSummary.tax !== null &&
                  chargeSummary.tax !== undefined &&
                  chargeSummary.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-700">Tax</span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(chargeSummary.tax, currency)}
                      </span>
                    </div>
                  )}
              </div>
            </div>

            {/* Separator */}
            <div className="border-t border-zinc-100 my-6" />

            {/* New Subscription */}
            <div className="mb-6">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                New Subscription
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-700">Recurring Amount</span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(preview.newPlan.recurringPreTaxAmount, currency)}/
                    {preview.newPlan.paymentFrequencyInterval.toLowerCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-700">Next Billing Date</span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatDate(preview.newPlan.nextBillingDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Spacer to push button to bottom */}
            <div className="flex-1" />

            {/* Confirm Button */}
            <button
              onClick={onConfirm}
              disabled={isConfirming}
              className="w-full rounded-full px-6 py-3 font-medium transition-colors bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isConfirming ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                'Confirm'
              )}
            </button>
          </div>
        </div>
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
    <div className="space-y-8 py-4">
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center gap-4">
          <Logo variant="tiled" size="md" showText={false} />
          <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
          <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="text-center space-y-1">
          <DialogTitle className="text-xl font-semibold">Plan Change Processing</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Your plan change to {newPlanName} is being processed
          </DialogDescription>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm font-medium">What happens next</p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Your plan change will complete within a few minutes
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              You&apos;ll receive an email confirmation once the change is complete
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Track the status in your customer portal at any time
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-4">
        <button
          onClick={onOpenPortal}
          disabled={isPortalLoading}
          className="w-full px-6 py-2.5 text-sm font-medium rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
          className="w-full px-6 py-2.5 text-sm font-medium rounded-full border border-border hover:bg-accent transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function MinimalLoadingView() {
  return (
    <div className="space-y-6 py-4">
      <DialogTitle className="sr-only">Loading</DialogTitle>
      <DialogDescription className="sr-only">Processing your request...</DialogDescription>
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <Logo variant="tiled" size="md" showText={false} />
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Preparing your plan details...</p>
      </div>
    </div>
  );
}

function PreviewLoadingView() {
  return (
    <div className="px-6 pb-6">
      <DialogTitle className="sr-only">Loading plan preview</DialogTitle>
      <DialogDescription className="sr-only">
        Calculating your plan change details...
      </DialogDescription>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Panel Skeleton */}
        <div className="flex flex-col h-full md:col-span-1">
          {/* Header with Back Button */}
          <div className="flex items-center gap-2 mb-8 pt-6">
            <div className="w-[18px] h-[18px] rounded bg-zinc-200 animate-pulse" />
            <div className="h-4 w-40 bg-zinc-200 rounded animate-pulse" />
          </div>

          {/* Plan & Billing Info */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-3 w-12 bg-zinc-200 rounded animate-pulse" />
              <div className="h-3 w-24 bg-zinc-200 rounded animate-pulse" />
            </div>
            <div className="flex justify-between items-center">
              <div className="h-3 w-16 bg-zinc-200 rounded animate-pulse" />
              <div className="h-3 w-20 bg-zinc-200 rounded animate-pulse" />
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Timeline Section */}
          <div className="pb-6">
            <div className="h-4 w-48 bg-zinc-200 rounded animate-pulse mb-4" />

            <div className="relative space-y-4">
              {/* Timeline connector line */}
              <div className="absolute left-1.5 top-6 bottom-6 w-px bg-zinc-200" />

              {/* Timeline Item 1 */}
              <div className="relative flex items-start gap-3">
                <div className="relative z-10 w-3 h-3 rounded-full bg-zinc-300 shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-3 w-16 bg-zinc-200 rounded animate-pulse" />
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-zinc-200 rounded animate-pulse" />
                    <div className="h-2 w-4/5 bg-zinc-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Timeline Item 2 */}
              <div className="relative flex items-start gap-3">
                <div className="relative z-10 w-3 h-3 rounded-full bg-zinc-300 shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-3 w-32 bg-zinc-200 rounded animate-pulse" />
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-zinc-200 rounded animate-pulse" />
                    <div className="h-2 w-3/4 bg-zinc-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel Skeleton */}
        <div className="flex flex-col pt-6 md:col-span-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col h-full">
            {/* Amount Due Today */}
            <div className="text-center pb-6 mb-6 border-b border-zinc-100">
              <div className="h-3 w-32 bg-zinc-200 rounded animate-pulse mx-auto mb-3" />
              <div className="h-10 w-48 bg-zinc-200 rounded animate-pulse mx-auto" />
            </div>

            {/* Proration Details */}
            <div className="mb-6">
              <div className="h-3 w-32 bg-zinc-200 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {/* Line items */}
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-start">
                    <div className="h-3 w-40 bg-zinc-200 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-zinc-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Separator */}
            <div className="border-t border-zinc-100 my-6" />

            {/* New Subscription */}
            <div className="mb-6">
              <div className="h-3 w-32 bg-zinc-200 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-3 w-32 bg-zinc-200 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-zinc-200 rounded animate-pulse" />
                </div>
                <div className="flex justify-between">
                  <div className="h-3 w-28 bg-zinc-200 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-zinc-200 rounded animate-pulse" />
                </div>
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Confirm Button Skeleton */}
            <div className="w-full h-12 rounded-full bg-zinc-200 animate-pulse mt-6" />
          </div>
        </div>
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
      <div className="flex flex-col items-center space-y-4">
        <Logo variant="tiled" size="md" showText={false} />
        <div className="text-center space-y-1">
          <DialogTitle className="text-xl font-semibold">Unable to Change Plan</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {errorMessage || (errorCode && `Error: ${errorCode}`) || 'An unexpected error occurred'}
          </DialogDescription>
        </div>
      </div>

      {/* Dino */}
      <div className="flex justify-center py-4">
        <Image
          src={mediaClient.getIconMediaUrl('icons/dino.svg')}
          alt="Error"
          width={120}
          height={120}
          unoptimized
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-2">
        <button
          onClick={onOpenPortal}
          disabled={isPortalLoading}
          className="w-full px-6 py-2.5 text-sm font-medium rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
          className="w-full px-6 py-2.5 text-sm font-medium rounded-full border border-border hover:bg-accent transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function RequestSentView({ planName, onClose }: { planName: string; onClose: () => void }) {
  return (
    <div className="space-y-8 py-4">
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center gap-4">
          <Logo variant="tiled" size="md" showText={false} />
          <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
          <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
            <Mail className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="text-center space-y-1">
          <DialogTitle className="text-xl font-semibold">Request Sent</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Your request to change to {planName} has been sent
          </DialogDescription>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm font-medium">What happens next</p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Workspace owners will be notified of your request
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              They&apos;ll review and approve or decline the plan change
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              You&apos;ll receive an email notification once your request is processed
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full px-6 py-2.5 text-sm font-medium rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors"
      >
        Done
      </button>
    </div>
  );
}

function CheckoutView() {
  return (
    <div className="space-y-6 py-4">
      <div className="flex items-start gap-4">
        <Logo variant="tiled" size="md" showText={false} />
        <div className="flex flex-col space-y-1">
          <DialogTitle className="text-xl font-semibold">Redirecting to Checkout</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Please wait while we prepare your checkout session...
          </DialogDescription>
        </div>
      </div>
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}

export function PlanChangePreviewModal({
  open,
  onOpenChange,
  newPlanId,
  onComplete,
  predictedFlow = 'unknown',
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

  const { mutate: managePlan, isPending: isManagePlanPending } = useManagePlan({
    onCheckout: async (data) => {
      // Got checkout response - need to create session with Better Auth
      if (!workspaceId) {
        setErrorInfo({ message: 'Workspace ID is required for checkout' });
        setModalState('error');
        return;
      }

      setModalState('checkout');
      try {
        const result = await authClient.dodopayments.checkoutSession({
          slug: data.slug,
          referenceId: workspaceId,
          metadata: {
            workspace_id: workspaceId,
          },
          customization: {
            theme: 'light',
            show_order_details: true,
            show_on_demand_tag: false,
          },
          return_url: `${env.dashboard.url}/${workspaceId}/settings?tab=plan-usage`,
        });

        if (result.error) {
          throw new Error(result.error.message || 'Failed to create checkout session');
        }

        if (!result.data?.url) {
          throw new Error('No checkout URL returned');
        }

        // Redirect to checkout
        window.location.href = result.data.url;
      } catch (error) {
        const err = error as Error;
        setErrorInfo({
          message: err.message || 'Failed to create checkout session',
        });
        setModalState('error');
      }
    },
    onPreview: (data) => {
      setPreviewData(data);
      setModalState('preview');
    },
    onExecute: (data) => {
      setCompletedPlanName(data.newPlanName);
      setModalState('success');
    },
    onRequest: (data) => {
      setCompletedPlanName(data.planName);
      setModalState('request-sent');
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

  // Fetch preview/initiate flow when modal opens with a new plan
  useEffect(() => {
    if (open && newPlanId && workspaceId) {
      setModalState('loading');
      setPreviewData(null);
      setErrorInfo({ message: '' });
      // Call without action - server will route appropriately
      // (checkout, preview, or request based on subscription status and user role)
      managePlan({ planId: newPlanId, workspaceId });
    }
    // managePlan is a mutation function that changes on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, newPlanId, workspaceId]);

  const handleConfirm = () => {
    if (!newPlanId || !workspaceId) return;
    setModalState('confirming');
    // Execute the plan change
    managePlan({ planId: newPlanId, workspaceId, action: 'execute' });
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

  const isWideLayout =
    (modalState === 'loading' && predictedFlow === 'preview') ||
    modalState === 'preview' ||
    modalState === 'confirming';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={isWideLayout ? 'sm:max-w-4xl' : 'sm:max-w-md'}
        showCloseButton={false}
      >
        {modalState === 'loading' &&
          (predictedFlow === 'preview' ? <PreviewLoadingView /> : <MinimalLoadingView />)}
        {modalState === 'checkout' && <CheckoutView />}
        {modalState === 'preview' && previewData && (
          <PreviewView
            preview={previewData}
            isConfirming={isManagePlanPending}
            onConfirm={handleConfirm}
            onCancel={handleClose}
          />
        )}
        {modalState === 'confirming' && previewData && (
          <PreviewView
            preview={previewData}
            isConfirming={isManagePlanPending}
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
        {modalState === 'request-sent' && (
          <RequestSentView planName={completedPlanName} onClose={handleClose} />
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
