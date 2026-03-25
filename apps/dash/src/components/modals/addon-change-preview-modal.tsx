'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@userplane/ui/components/dialog';
import Logo from '@userplane/ui/components/logo';
import { Skeleton } from '@userplane/ui/components/skeleton';
import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useEffect, useRef, useState } from 'react';

import { useManageAddons, useOpenCustomerPortal } from '@/features/billing';
import { useAddonsStatus } from '@/features/billing/queries';
import { billingAddonModalParser } from '@/lib/parsers';
import { useWorkspaceId } from '@/stores/workspace';
import type { PlanChangePreviewData } from '@/types';

type ModalState = 'loading' | 'preview' | 'confirming' | 'success' | 'error';

interface AddonErrorInfo {
  message: string;
  code?: string;
}

const SEATS_PER_PACK = 5;
const MAX_SEAT_PACKS = 5;

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function LoadingView() {
  return (
    <>
      <div className="p-6 pb-4">
        <DialogTitle className="sr-only">Loading add-on preview</DialogTitle>
        <DialogDescription className="sr-only">
          Loading your current add-ons and preparing the sheet.
        </DialogDescription>
        <div className="flex items-start gap-4">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex flex-col space-y-2">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-3 w-80" />
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left panel — mirrors EditView md:col-span-1 */}
          <div className="flex flex-col h-full md:col-span-1">
            {/* Key-value rows */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-8" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-8" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-10" />
              </div>
            </div>

            {/* Stepper */}
            <div className="pt-6">
              <Skeleton className="h-10 w-40 rounded-md" />
            </div>

            <div className="flex-1" />

            {/* "What changes" timeline */}
            <div className="pt-6">
              <Skeleton className="h-4 w-28 mb-4" />
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-3 h-3 rounded-full shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Skeleton className="w-3 h-3 rounded-full shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel — mirrors EditView md:col-span-2 */}
          <div className="flex flex-col md:col-span-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col h-full">
              {/* Centered header: label + large value */}
              <div className="text-center pb-6 mb-6 border-b border-zinc-100">
                <Skeleton className="h-4 w-24 mx-auto mb-3" />
                <Skeleton className="h-10 w-36 mx-auto" />
              </div>

              {/* Summary section */}
              <div className="mb-6">
                <Skeleton className="h-3 w-20 mb-4" />
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-100 my-6" />

              {/* Usage section */}
              <div className="mb-6">
                <Skeleton className="h-3 w-16 mb-4" />
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>

              <div className="flex-1" />

              {/* Button row */}
              <div className="flex gap-2 mt-6">
                <Skeleton className="flex-1 h-12 rounded-md" />
                <Skeleton className="flex-1 h-12 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AddonPreviewView({
  currentQuantity,
  newQuantity,
  preview,
  isConfirming,
  onConfirm,
  onCancel,
}: {
  currentQuantity: number;
  newQuantity: number;
  preview: PlanChangePreviewData;
  isConfirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const additionalSeats = newQuantity * SEATS_PER_PACK;
  const chargeCurrency =
    preview.immediateCharge?.chargeSummary.currency ?? preview.creditAmount?.currency ?? 'USD';
  const amountDueToday = preview.immediateCharge
    ? preview.immediateCharge.chargeSummary.totalAmount
    : 0;
  const lineItems = preview.immediateCharge?.lineItems ?? [];

  return (
    <>
      <div className="p-6 pb-4">
        <div className="flex items-start gap-4">
          <Logo variant="tiled" size="md" showText={false} />
          <div className="flex flex-col space-y-1">
            <DialogTitle className="text-xl font-semibold">Review seat add-on changes</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Adjust your seat packs and confirm billing changes.
            </DialogDescription>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col h-full md:col-span-1">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600">Current Add-on Packs</span>
                <span className="text-sm text-foreground font-semibold">{currentQuantity}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600">New Add-on Packs</span>
                <span className="text-sm text-foreground font-semibold">{newQuantity}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600">Additional Seats</span>
                <span className="text-sm text-foreground font-semibold">+{additionalSeats}</span>
              </div>
            </div>

            <div className="flex-1" />

            <div className="pt-6">
              <h4 className="text-base font-semibold text-foreground mb-4">What changes</h4>

              <div className="relative space-y-4">
                <div className="absolute left-1.5 top-6 bottom-6 w-px bg-zinc-200" />

                <div className="relative flex items-start gap-3">
                  <div className="relative z-10 w-3 h-3 rounded-full bg-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground mb-1">Today</div>
                    <div className="text-xs text-zinc-600 leading-relaxed">
                      Your seat add-on pack quantity updates immediately after confirmation.
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
                      , recurring billing reflects your updated add-on quantity.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:col-span-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col h-full">
              <div className="text-center pb-6 mb-6 border-b border-zinc-100">
                <div className="text-sm text-zinc-600 mb-3">Amount due today</div>
                <div className="text-4xl font-bold text-foreground">
                  {formatCurrency(amountDueToday, chargeCurrency)}
                </div>
              </div>

              {preview.immediateCharge ? (
                <div className="mb-6">
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                    Proration Details
                  </div>
                  <div className="space-y-3">
                    {lineItems.map((item) => (
                      <div
                        key={`${item.name}-${item.unitPrice}-${item.quantity}`}
                        className="flex justify-between items-start"
                      >
                        <span className="text-sm text-zinc-700">
                          {item.prorationFactor ? `${item.name} (Prorated)` : item.name}
                        </span>
                        <span className="text-sm font-semibold text-foreground ml-4 text-right">
                          {formatCurrency(item.unitPrice * item.quantity, chargeCurrency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : preview.creditAmount ? (
                <div className="mb-6">
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                    Credit Details
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-zinc-700">Account Credit</span>
                      <span className="text-sm font-semibold text-green-600 ml-4 text-right">
                        +
                        {formatCurrency(preview.creditAmount.amount, preview.creditAmount.currency)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">{preview.creditAmount.summary}</p>
                  </div>
                </div>
              ) : null}

              <div className="border-t border-zinc-100 my-6" />

              <div className="mb-6">
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                  Recurring Summary
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-700">Recurring Amount</span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(preview.newPlan.recurringPreTaxAmount, chargeCurrency)}/
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

              <div className="flex-1" />

              <div className="flex gap-2 mt-6">
                <button
                  onClick={onConfirm}
                  disabled={isConfirming}
                  className="flex-1 px-6 py-3 text-sm font-medium rounded-md transition-colors bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  className="flex-1 px-6 py-3 text-sm font-medium rounded-md transition-colors border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
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
  currentQuantity,
  newQuantity,
  preview,
  onClose,
  onOpenPortal,
  isPortalLoading,
}: {
  currentQuantity: number;
  newQuantity: number;
  preview: PlanChangePreviewData | null;
  onClose: () => void;
  onOpenPortal: () => void;
  isPortalLoading: boolean;
}) {
  const currency =
    preview?.immediateCharge?.chargeSummary.currency ?? preview?.creditAmount?.currency ?? 'USD';

  return (
    <>
      <div className="p-6 pb-4">
        <div className="flex items-start gap-4">
          <Logo variant="tiled" size="md" showText={false} />
          <div className="flex flex-col space-y-1">
            <DialogTitle className="text-xl font-semibold">Add-on change processing</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Your seat add-on update is being processed.
            </DialogDescription>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col h-full md:col-span-1">
            <div className="space-y-4">
              <p className="text-sm font-medium">What happens next</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Your add-on request will finalize within a few minutes.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Webhooks will sync your subscription and seat limits.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Usage views refresh automatically once processing completes.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1" />

            <div className="pt-6">
              <h4 className="text-base font-semibold text-foreground mb-4">What happened</h4>
              <div className="relative space-y-4">
                <div className="absolute left-1.5 top-6 bottom-6 w-px bg-zinc-200" />

                <div className="relative flex items-start gap-3">
                  <div className="relative z-10 w-3 h-3 rounded-full bg-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground mb-1">Now</div>
                    <div className="text-xs text-zinc-600 leading-relaxed">
                      Your add-on update request was submitted and is processing.
                    </div>
                  </div>
                </div>

                <div className="relative flex items-start gap-3">
                  <div className="relative z-10 w-3 h-3 rounded-full bg-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground mb-1">Next sync</div>
                    <div className="text-xs text-zinc-600 leading-relaxed">
                      Webhook sync updates subscription add-ons and seat limits automatically.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:col-span-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col h-full">
              <div className="text-center pb-6 mb-6 border-b border-zinc-100">
                <div className="text-sm text-zinc-600 mb-3">Add-on Packs</div>
                <div className="text-4xl font-bold text-foreground">
                  {currentQuantity} → {newQuantity}
                </div>
              </div>

              <div className="mb-6">
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                  Usage
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-700">Seats Included by Add-on</span>
                    <span className="text-sm font-semibold text-foreground">
                      +{newQuantity * SEATS_PER_PACK}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-700">Pack Change</span>
                    <span className="text-sm font-semibold text-foreground">
                      {currentQuantity} → {newQuantity}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-100 my-6" />

              <div className="mb-6">
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                  Billing Details
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-700">Additional Seats</span>
                    <span className="text-sm font-semibold text-foreground">
                      {(newQuantity - currentQuantity) * SEATS_PER_PACK > 0 ? '+' : ''}
                      {(newQuantity - currentQuantity) * SEATS_PER_PACK}
                    </span>
                  </div>
                  {preview && (
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-700">Recurring Amount</span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(preview.newPlan.recurringPreTaxAmount, currency)}/
                        {preview.newPlan.paymentFrequencyInterval.toLowerCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1" />

              <div className="flex gap-2 mt-6">
                <button
                  onClick={onOpenPortal}
                  disabled={isPortalLoading}
                  className="flex-1 px-6 py-3 text-sm font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                  className="flex-1 px-6 py-3 text-sm font-medium rounded-md border border-border hover:bg-accent transition-colors"
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

function ErrorView({
  error,
  onClose,
  onOpenPortal,
  isPortalLoading,
}: {
  error: AddonErrorInfo;
  onClose: () => void;
  onOpenPortal: () => void;
  isPortalLoading: boolean;
}) {
  return (
    <>
      <div className="p-6 pb-4">
        <div className="flex items-start gap-4">
          <Logo variant="tiled" size="md" showText={false} />
          <div className="flex flex-col space-y-1">
            <DialogTitle className="text-xl font-semibold">Unable to change add-ons</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {error.message}
            </DialogDescription>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col h-full md:col-span-1">
            <div className="space-y-4">
              <p className="text-sm font-medium">What you can do</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">Retry the request in a moment.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    If you are a member, ask an owner or admin to make billing changes.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Contact support if the issue continues.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1" />

            <div className="pt-6">
              <h4 className="text-base font-semibold text-foreground mb-4">What happened</h4>
              <div className="relative space-y-4">
                <div className="absolute left-1.5 top-6 bottom-6 w-px bg-zinc-200" />

                <div className="relative flex items-start gap-3">
                  <div className="relative z-10 w-3 h-3 rounded-full bg-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground mb-1">Request sent</div>
                    <div className="text-xs text-zinc-600 leading-relaxed">
                      We attempted to submit your add-on change.
                    </div>
                  </div>
                </div>

                <div className="relative flex items-start gap-3">
                  <div className="relative z-10 w-3 h-3 rounded-full bg-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground mb-1">
                      Processing failed
                    </div>
                    <div className="text-xs text-zinc-600 leading-relaxed">
                      The change didn&apos;t complete; no additional seats were applied.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:col-span-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col h-full">
              <div className="text-center pb-6 mb-6 border-b border-zinc-100">
                <div className="text-sm text-zinc-600 mb-3">Status</div>
                <div className="text-4xl font-bold text-foreground">Failed</div>
              </div>

              <div className="mb-6">
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                  Error Details
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-zinc-700">Reason</span>
                    <span className="text-sm font-semibold text-foreground ml-4 text-right max-w-[65%]">
                      {error.message}
                    </span>
                  </div>
                  {error.code ? (
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-700">Error Code</span>
                      <span className="text-sm font-semibold text-foreground font-mono">
                        {error.code}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="border-t border-zinc-100 my-6" />

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

              <div className="flex-1" />

              <div className="flex gap-2 mt-6">
                <button
                  onClick={onOpenPortal}
                  disabled={isPortalLoading}
                  className="flex-1 px-6 py-3 text-sm font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                  className="flex-1 px-6 py-3 text-sm font-medium rounded-md border border-border hover:bg-accent transition-colors"
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

export function AddonChangePreviewModal({
  requestedQuantity,
  onComplete,
}: {
  requestedQuantity?: number;
  onComplete?: () => void;
}) {
  const workspaceId = useWorkspaceId();
  const [addonModal, setAddonModal] = useQueryState('addon-modal', billingAddonModalParser);
  const open = addonModal === 'seats';

  const { data: addonsResult, isLoading: isAddonsLoading } = useAddonsStatus();
  const addonsData = addonsResult?.success ? addonsResult.data : null;
  const { mutate: openCustomerPortal, isPending: isPortalPending } = useOpenCustomerPortal();

  const [addonState, setAddonState] = useState({
    step: 'loading' as ModalState,
    previewData: null as PlanChangePreviewData | null,
    errorInfo: { message: '' } as AddonErrorInfo,
    currentQuantity: 0,
    newQuantity: 0,
  });

  const { mutate: manageAddons, isPending } = useManageAddons({
    onPreview: (data) => {
      setAddonState((prev) => ({ ...prev, previewData: data, step: 'preview' }));
    },
    onExecute: () => {
      setAddonState((prev) => ({ ...prev, step: 'success' }));
    },
    onError: (error) => {
      const code = error.data?.code || error.code;
      const message =
        code === 'BILLING_MANAGEMENT_UNAVAILABLE_FOR_MEMBER'
          ? 'Only workspace owners and admins can change billing add-ons.'
          : error.data?.message || error.message || 'Failed to change add-ons.';
      setAddonState((prev) => ({ ...prev, errorInfo: { message, code }, step: 'error' }));
    },
  });

  const manageAddonsRef = useRef(manageAddons);
  manageAddonsRef.current = manageAddons;

  // Reset state when modal opens or addons data changes (adjust state during render)
  const prevAddonKeyRef = useRef<string | null>(null);
  const addonKey = open
    ? isAddonsLoading
      ? 'loading'
      : addonsData && workspaceId
        ? `${workspaceId}-${addonsData.seatsQuantity}-${requestedQuantity ?? 'default'}`
        : null
    : null;
  if (addonKey !== prevAddonKeyRef.current) {
    prevAddonKeyRef.current = addonKey;
    if (addonKey === 'loading') {
      setAddonState((prev) => ({ ...prev, step: 'loading' }));
    } else if (open && addonsData && workspaceId) {
      const initialSeatsQuantity = Math.min(addonsData.seatsQuantity, MAX_SEAT_PACKS);
      setAddonState({
        step: 'loading',
        previewData: null,
        errorInfo: { message: '' },
        currentQuantity: initialSeatsQuantity,
        newQuantity: requestedQuantity ?? initialSeatsQuantity,
      });
    }
  }

  // Auto-trigger preview when modal opens with data
  useEffect(() => {
    if (!open || isAddonsLoading || !addonsData || !workspaceId) return;
    const initialSeatsQuantity = Math.min(addonsData.seatsQuantity, MAX_SEAT_PACKS);
    const qty = requestedQuantity ?? initialSeatsQuantity;
    manageAddonsRef.current({
      workspaceId,
      seatsQuantity: qty,
      action: 'preview',
    });
  }, [open, addonsData, isAddonsLoading, workspaceId, requestedQuantity]);

  const handleConfirm = () => {
    if (!workspaceId) return;
    setAddonState((prev) => ({ ...prev, step: 'confirming' }));
    manageAddons({
      workspaceId,
      seatsQuantity: addonState.newQuantity,
      action: 'execute',
    });
  };

  const handleClose = () => {
    const wasSuccess = addonState.step === 'success';
    setAddonModal(null);
    if (wasSuccess) onComplete?.();
    setTimeout(() => {
      setAddonState((prev) => ({
        ...prev,
        step: 'loading',
        previewData: null,
        errorInfo: { message: '' },
      }));
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent
        className="p-0 gap-0 max-w-[calc(100%-2rem)] sm:max-w-4xl max-h-[85vh] overflow-y-auto"
        showCloseButton={true}
      >
        <DialogTitle className="sr-only">Billing Add-ons</DialogTitle>
        <DialogDescription className="sr-only">
          Manage and confirm seat add-on billing changes.
        </DialogDescription>

        {addonState.step === 'loading' && <LoadingView />}

        {(addonState.step === 'preview' || addonState.step === 'confirming') &&
        addonState.previewData ? (
          <AddonPreviewView
            currentQuantity={addonState.currentQuantity}
            newQuantity={addonState.newQuantity}
            preview={addonState.previewData}
            isConfirming={addonState.step === 'confirming' || isPending}
            onConfirm={handleConfirm}
            onCancel={handleClose}
          />
        ) : null}

        {addonState.step === 'success' ? (
          <SuccessView
            currentQuantity={addonState.currentQuantity}
            newQuantity={addonState.newQuantity}
            preview={addonState.previewData}
            onClose={handleClose}
            onOpenPortal={() => openCustomerPortal()}
            isPortalLoading={isPortalPending}
          />
        ) : null}

        {addonState.step === 'error' ? (
          <ErrorView
            error={addonState.errorInfo}
            onClose={handleClose}
            onOpenPortal={() => openCustomerPortal()}
            isPortalLoading={isPortalPending}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
