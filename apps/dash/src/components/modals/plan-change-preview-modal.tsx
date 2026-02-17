'use client';

import { PLAN_NAMES, type PlanId } from '@workspace/pricing';
import Logo from '@workspace/ui/components/logo';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@workspace/ui/components/sheet';
import { ArrowRight, CheckCircle2, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useManagePlan, useOpenCustomerPortal } from '@/features/billing';
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

type PredictedFlow = 'checkout' | 'preview' | 'unknown';

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
    const creditCurrency = preview.creditAmount?.currency ?? 'USD';

    return (
      <>
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <SheetTitle className="text-xl font-semibold">Review your plan change</SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                Review the details below before confirming your plan change
              </SheetDescription>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Panel */}
            <div className="flex flex-col h-full md:col-span-1">
              {/* Plan & Billing Info */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600">Current Plan</span>
                  <span className="text-sm text-foreground font-semibold">
                    {preview.currentPlan.planName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600">New Plan</span>
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

              {/* How Your Plan Change Works */}
              <div className="pt-6">
                <h4 className="text-base font-semibold text-foreground mb-4">
                  How your plan change works
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
                        Your plan changes immediately.
                        {preview.creditAmount
                          ? ' The unused time on your current plan will be credited to your account.'
                          : ' No additional charges apply.'}
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
                          {formatCurrency(preview.newPlan.recurringPreTaxAmount, creditCurrency)}
                        </span>{' '}
                        per {preview.newPlan.paymentFrequencyInterval.toLowerCase()}.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="flex flex-col md:col-span-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col h-full">
                {/* Credit or No Charge */}
                <div className="text-center pb-6 mb-6 border-b border-zinc-100">
                  <div className="text-sm text-zinc-600 mb-3">Amount due today</div>
                  <div className="text-4xl font-bold text-foreground">
                    {formatCurrency(0, creditCurrency)}
                  </div>
                </div>

                {/* Credit Details */}
                {preview.creditAmount && (
                  <div className="mb-6">
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                      Credit Details
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-zinc-700">Account Credit</span>
                        <span className="text-sm font-semibold text-green-600 ml-4 text-right">
                          +
                          {formatCurrency(
                            preview.creditAmount.amount,
                            preview.creditAmount.currency
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">{preview.creditAmount.summary}</p>
                    </div>
                  </div>
                )}

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
                        {formatCurrency(preview.newPlan.recurringPreTaxAmount, creditCurrency)}/
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

                {/* Spacer to push buttons to bottom */}
                <div className="flex-1" />

                {/* Action Buttons */}
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={onConfirm}
                    disabled={isConfirming}
                    className="flex-1 px-6 py-3 text-sm font-medium rounded-full transition-colors bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isConfirming ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm'
                    )}
                  </button>
                  <button
                    onClick={onCancel}
                    disabled={isConfirming}
                    className="flex-1 px-6 py-3 text-sm font-medium rounded-full transition-colors border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const { currency } = preview.immediateCharge.chargeSummary;
  const { lineItems, chargeSummary } = preview.immediateCharge;

  return (
    <>
      <div className="p-6 pb-4">
        <div className="flex items-start gap-4">
          <Logo variant="tiled" size="md" showText={false} />
          <div className="flex flex-col space-y-1">
            <SheetTitle className="text-xl font-semibold">
              {preview.isUpgrade ? 'Review your upgrade' : 'Review your plan change'}
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              Review the details below before confirming
            </SheetDescription>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Panel */}
          <div className="flex flex-col h-full md:col-span-1">
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
            <div className="pt-6">
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
                      Your plan changes immediately. You&apos;ll be charged a prorated amount based
                      on your remaining billing period.
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
          <div className="flex flex-col md:col-span-2">
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

              {/* Spacer to push buttons to bottom */}
              <div className="flex-1" />

              {/* Action Buttons */}
              <div className="flex gap-2 mt-6">
                <button
                  onClick={onConfirm}
                  disabled={isConfirming}
                  className="flex-1 px-6 py-3 text-sm font-medium rounded-full transition-colors bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isConfirming ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Confirm'
                  )}
                </button>
                <button
                  onClick={onCancel}
                  disabled={isConfirming}
                  className="flex-1 px-6 py-3 text-sm font-medium rounded-full transition-colors border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SuccessView({
  newPlanName,
  preview,
  onClose,
  onOpenPortal,
  isPortalLoading,
}: {
  newPlanName: string;
  preview: PlanChangePreviewData | null;
  onClose: () => void;
  onOpenPortal: () => void;
  isPortalLoading: boolean;
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

  const currency =
    preview?.immediateCharge?.chargeSummary.currency ?? preview?.creditAmount?.currency ?? 'USD';

  return (
    <>
      <div className="p-6 pb-4">
        <div className="flex items-start gap-4">
          <Logo variant="tiled" size="md" showText={false} />
          <div className="flex flex-col space-y-1">
            <SheetTitle className="text-xl font-semibold">Plan Change Processing</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              Your plan change to {newPlanName} is being processed
            </SheetDescription>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Panel */}
          <div className="flex flex-col md:col-span-1">
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

            {/* Spacer to push content to bottom */}
            <div className="flex-1" />

            {/* Timeline */}
            {preview && (
              <div className="pt-6">
                <h4 className="text-base font-semibold text-foreground mb-4">
                  What&apos;s changing
                </h4>

                <div className="relative space-y-4">
                  <div className="absolute left-1.5 top-6 bottom-6 w-px bg-zinc-200" />

                  <div className="relative flex items-start gap-3">
                    <div className="relative z-10 w-3 h-3 rounded-full bg-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground mb-1">Now</div>
                      <div className="text-xs text-zinc-600 leading-relaxed">
                        Switching from {preview.currentPlan.planName} to {preview.newPlan.planName}.
                        Your new features are being activated.
                      </div>
                    </div>
                  </div>

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
            )}
          </div>

          {/* Right Panel */}
          <div className="flex flex-col md:col-span-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col h-full">
              {preview ? (
                <>
                  <div className="text-center pb-6 mb-6 border-b border-zinc-100">
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                      Plan Summary
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <div className="text-xs text-zinc-500 mb-1">Previous Plan</div>
                        <div className="text-xl font-bold text-zinc-400">
                          {preview.currentPlan.planName}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-zinc-400 shrink-0" />
                      <div className="text-center">
                        <div className="text-xs text-zinc-500 mb-1">New Plan</div>
                        <div className="text-xl font-bold text-foreground">
                          {preview.newPlan.planName}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Plan Details */}
                  <div>
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                      Plan Details
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-zinc-700">Previous Plan</span>
                        <span className="text-sm font-semibold text-foreground">
                          {preview.currentPlan.planName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-zinc-700">Billing</span>
                        <span className="text-sm font-semibold text-foreground capitalize">
                          {preview.newPlan.billingInterval}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-zinc-100 my-6" />
                  {/* New Subscription */}
                  <div className="mb-6">
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                      New Subscription
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-zinc-700">New Plan</span>
                        <span className="text-sm font-semibold text-foreground">
                          {preview.newPlan.planName}
                        </span>
                      </div>
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
                </>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 py-6 space-y-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                  <p className="text-sm text-muted-foreground text-center">
                    Your new plan is being activated. You&apos;ll receive an email confirmation
                    shortly.
                  </p>
                </div>
              )}

              {/* Spacer to push buttons to bottom */}
              <div className="flex-1" />

              {/* Action Buttons */}
              <div className="flex gap-2 mt-6">
                <button
                  onClick={onOpenPortal}
                  disabled={isPortalLoading}
                  className="flex-1 px-6 py-3 text-sm font-medium rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                  className="flex-1 px-6 py-3 text-sm font-medium rounded-full border border-border hover:bg-accent transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MinimalLoadingView() {
  return (
    <div className="p-6">
      <SheetTitle className="sr-only">Loading</SheetTitle>
      <SheetDescription className="sr-only">Processing your request...</SheetDescription>
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
    <>
      <div className="p-6 pb-4">
        <SheetTitle className="sr-only">Loading plan preview</SheetTitle>
        <SheetDescription className="sr-only">
          Calculating your plan change details...
        </SheetDescription>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-zinc-200 animate-pulse shrink-0" />
          <div className="flex flex-col space-y-2">
            <div className="h-5 w-48 bg-zinc-200 rounded animate-pulse" />
            <div className="h-3 w-64 bg-zinc-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Panel Skeleton */}
          <div className="flex flex-col h-full md:col-span-1">
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
            <div className="pt-6">
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
          <div className="flex flex-col md:col-span-2">
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

              {/* Button Skeletons */}
              <div className="flex gap-2 mt-6">
                <div className="flex-1 h-12 rounded-full bg-zinc-200 animate-pulse" />
                <div className="flex-1 h-12 rounded-full bg-zinc-200 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
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
    <>
      <div className="p-6 pb-4">
        <div className="flex items-start gap-4">
          <Logo variant="tiled" size="md" showText={false} />
          <div className="flex flex-col space-y-1">
            <SheetTitle className="text-xl font-semibold">Unable to Change Plan</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              {errorMessage ||
                (errorCode && `Error: ${errorCode}`) ||
                'An unexpected error occurred'}
            </SheetDescription>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Panel */}
          <div className="flex flex-col h-full md:col-span-1">
            <div className="space-y-4">
              <p className="text-sm font-medium">What you can do</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Try again in a few moments — it may be a temporary issue
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Manage your subscription directly from the customer portal
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Contact support if the issue persists
                  </p>
                </div>
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Timeline */}
            <div className="pt-6">
              <h4 className="text-base font-semibold text-foreground mb-4">What happened</h4>

              <div className="relative space-y-4">
                {/* Timeline connector line */}
                <div className="absolute left-1.5 top-6 bottom-6 w-px bg-zinc-200" />

                {/* Step 1 */}
                <div className="relative flex items-start gap-3">
                  <div className="relative z-10 w-3 h-3 rounded-full bg-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground mb-1">
                      Plan Change Requested
                    </div>
                    <div className="text-xs text-zinc-600 leading-relaxed">
                      Your request to change plans was submitted for processing.
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative flex items-start gap-3">
                  <div className="relative z-10 w-3 h-3 rounded-full bg-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground mb-1">
                      Processing Failed
                    </div>
                    <div className="text-xs text-zinc-600 leading-relaxed">
                      The plan change could not be completed. No charges have been made to your
                      account.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex flex-col md:col-span-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col h-full">
              {/* Error Summary */}
              <div className="text-center pb-6 mb-6 border-b border-zinc-100">
                <div className="text-sm text-zinc-600 mb-3">Status</div>
                <div className="text-4xl font-bold text-foreground">Failed</div>
              </div>

              {/* Error Details */}
              <div className="mb-6">
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                  Error Details
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-700">Charges</span>
                    <span className="text-sm font-semibold text-foreground">None</span>
                  </div>
                  {errorMessage && (
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-zinc-700">Reason</span>
                      <span className="text-sm font-semibold text-foreground ml-4 text-right max-w-[60%]">
                        {errorMessage}
                      </span>
                    </div>
                  )}
                  {errorCode && (
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-700">Error Code</span>
                      <span className="text-sm font-semibold text-foreground font-mono">
                        {errorCode}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-zinc-100 my-6" />

              {/* Troubleshooting */}
              <div className="mb-6">
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                  Troubleshooting
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-700">Retry</span>
                    <span className="text-sm font-semibold text-foreground">Safe to try again</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-700">Alternative</span>
                    <span className="text-sm font-semibold text-foreground">Customer Portal</span>
                  </div>
                </div>
              </div>

              {/* Spacer to push buttons to bottom */}
              <div className="flex-1" />

              {/* Action Buttons */}
              <div className="flex gap-2 mt-6">
                <button
                  onClick={onOpenPortal}
                  disabled={isPortalLoading}
                  className="flex-1 px-6 py-3 text-sm font-medium rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                  className="flex-1 px-6 py-3 text-sm font-medium rounded-full border border-border hover:bg-accent transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function RequestSentView({ planName, onClose }: { planName: string; onClose: () => void }) {
  return (
    <>
      <div className="p-6 pb-4">
        <div className="flex items-start gap-4">
          <Logo variant="tiled" size="md" showText={false} />
          <div className="flex flex-col space-y-1">
            <SheetTitle className="text-xl font-semibold">Almost There</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              Reach out to a workspace owner or admin to complete the plan change to {planName}
            </SheetDescription>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Panel */}
          <div className="flex flex-col h-full md:col-span-1">
            <div className="space-y-4">
              <p className="text-sm font-medium">How to upgrade</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Ask a workspace owner or admin to upgrade your plan
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    They can change the plan from workspace billing settings
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Your workspace features will update automatically once the plan is changed
                  </p>
                </div>
              </div>
            </div>

            {/* Spacer to push content to bottom */}
            <div className="flex-1" />

            {/* Timeline */}
            <div className="pt-6">
              <h4 className="text-base font-semibold text-foreground mb-4">What happens next</h4>

              <div className="relative space-y-4">
                {/* Timeline connector line */}
                <div className="absolute left-1.5 top-6 bottom-6 w-px bg-zinc-200" />

                {/* Step 1 */}
                <div className="relative flex items-start gap-3">
                  <div className="relative z-10 w-3 h-3 rounded-full bg-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground mb-1">Contact Admin</div>
                    <div className="text-xs text-zinc-600 leading-relaxed">
                      Reach out to a workspace owner or admin to request the upgrade to {planName}.
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative flex items-start gap-3">
                  <div className="relative z-10 w-3 h-3 rounded-full bg-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground mb-1">Plan Activated</div>
                    <div className="text-xs text-zinc-600 leading-relaxed">
                      Once approved, your workspace features will update automatically.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex flex-col md:col-span-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col h-full">
              {/* Plan Requested */}
              <div className="text-center pb-6 mb-6 border-b border-zinc-100">
                <div className="text-sm text-zinc-600 mb-3">Requested Plan</div>
                <div className="text-4xl font-bold text-foreground">{planName}</div>
              </div>

              {/* Details */}
              <div className="mb-6">
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                  Details
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-700">Status</span>
                    <span className="text-sm font-semibold text-foreground">
                      Requires Admin Approval
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-700">Permission</span>
                    <span className="text-sm font-semibold text-foreground">Owner or Admin</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-100 my-6" />

              {/* What to Expect */}
              <div className="mb-6">
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                  What to Expect
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-700">Changes</span>
                    <span className="text-sm font-semibold text-foreground">
                      Immediate on approval
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-700">Your Data</span>
                    <span className="text-sm font-semibold text-foreground">Fully preserved</span>
                  </div>
                </div>
              </div>

              {/* Spacer to push buttons to bottom */}
              <div className="flex-1" />

              {/* Action Button */}
              <div className="flex gap-2 mt-6">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 text-sm font-medium rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function CheckoutView() {
  return (
    <>
      <div className="p-6 pb-4">
        <div className="flex items-start gap-4">
          <Logo variant="tiled" size="md" showText={false} />
          <div className="flex flex-col space-y-1">
            <SheetTitle className="text-xl font-semibold">Redirecting to Checkout</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              Please wait while we prepare your checkout session...
            </SheetDescription>
          </div>
        </div>
      </div>
      <div className="px-6 pb-6">
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    </>
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
    onCheckout: (data) => {
      if (data.checkoutUrl) {
        setModalState('checkout');
        window.location.href = data.checkoutUrl;
      } else {
        setErrorInfo({ message: 'No checkout URL returned' });
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
    onError: (error) => {
      const errorCode = (error as { code?: string }).code;

      // Member without billing permissions → show request-sent view
      if (errorCode === 'BILLING_MANAGEMENT_UNAVAILABLE_FOR_MEMBER') {
        const planName = newPlanId ? (PLAN_NAMES[newPlanId] ?? 'this plan') : 'this plan';
        setCompletedPlanName(planName);
        setModalState('request-sent');
        return;
      }

      // Extract structured error data if available (from UPSTREAM_PAYMENT_ERROR)
      const errorData = (error as { data?: { code?: string; message?: string } }).data;
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
      // (checkout or preview for owners/admins, error for members)
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

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="p-0 gap-0 max-h-[85vh] overflow-y-auto rounded-t-2xl"
        showCloseButton={true}
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
            preview={previewData}
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
      </SheetContent>
    </Sheet>
  );
}
