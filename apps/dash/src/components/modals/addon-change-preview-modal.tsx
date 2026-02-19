'use client';

import Logo from '@workspace/ui/components/logo';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@workspace/ui/components/sheet';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { CheckCircle2, ExternalLink, Loader2, Minus, Plus } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';

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
        <SheetTitle className="sr-only">Loading add-on preview</SheetTitle>
        <SheetDescription className="sr-only">
          Loading your current add-ons and preparing the sheet.
        </SheetDescription>
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
              <Skeleton className="h-10 w-40 rounded-full" />
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
                <Skeleton className="flex-1 h-12 rounded-full" />
                <Skeleton className="flex-1 h-12 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function EditView({
  currentQuantity,
  newQuantity,
  hasUnsavedChange,
  isSubmitting,
  onDecrease,
  onIncrease,
  onPreview,
  onCancel,
}: {
  currentQuantity: number;
  newQuantity: number;
  hasUnsavedChange: boolean;
  isSubmitting: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  onPreview: () => void;
  onCancel: () => void;
}) {
  const additionalSeats = newQuantity * SEATS_PER_PACK;

  return (
    <>
      <div className="p-6 pb-4">
        <div className="flex items-start gap-4">
          <Logo variant="tiled" size="md" showText={false} />
          <div className="flex flex-col space-y-1">
            <SheetTitle className="text-xl font-semibold">Billing Add-ons</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              Manage additional seat packs for your current subscription.
            </SheetDescription>
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

            <div className="pt-6">
              <div className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-1 py-1">
                <button
                  onClick={onDecrease}
                  disabled={isSubmitting || newQuantity <= 0}
                  className="h-8 w-8 rounded-full hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-14 text-center text-sm font-semibold">{newQuantity}</span>
                <button
                  onClick={onIncrease}
                  disabled={isSubmitting || newQuantity >= MAX_SEAT_PACKS}
                  className="h-8 w-8 rounded-full hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Plus className="h-4 w-4" />
                </button>
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
                      You choose a new seat add-on pack quantity.
                    </div>
                  </div>
                </div>

                <div className="relative flex items-start gap-3">
                  <div className="relative z-10 w-3 h-3 rounded-full bg-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground mb-1">
                      After Confirmation
                    </div>
                    <div className="text-xs text-zinc-600 leading-relaxed">
                      The add-on updates immediately and billing preview reflects proration.
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
                  Summary
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-700">Current Packs</span>
                    <span className="text-sm font-semibold text-foreground">{currentQuantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-700">New Packs</span>
                    <span className="text-sm font-semibold text-foreground">{newQuantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-700">Additional Seats</span>
                    <span className="text-sm font-semibold text-foreground">
                      +{additionalSeats}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-100 my-6" />

              <div className="mb-6">
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                  Usage
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-700">Seats Included by Add-on</span>
                    <span className="text-sm font-semibold text-foreground">
                      +{additionalSeats}
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

              <div className="flex-1" />

              <div className="flex gap-2 mt-6">
                <button
                  onClick={onPreview}
                  disabled={!hasUnsavedChange || isSubmitting}
                  className="flex-1 px-6 py-3 text-sm font-medium rounded-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Calculating Preview...' : 'Preview'}
                </button>
                <button
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 text-sm font-medium rounded-full border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
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
            <SheetTitle className="text-xl font-semibold">Review seat add-on changes</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              Adjust your seat packs and confirm billing changes.
            </SheetDescription>
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
                    {lineItems.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
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
            <SheetTitle className="text-xl font-semibold">Add-on change processing</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              Your seat add-on update is being processed.
            </SheetDescription>
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
            <SheetTitle className="text-xl font-semibold">Unable to change add-ons</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              {error.message}
            </SheetDescription>
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

export function AddonChangePreviewModal({ onComplete }: { onComplete?: () => void }) {
  const workspaceId = useWorkspaceId();
  const [addonModal, setAddonModal] = useQueryState('addon-modal', billingAddonModalParser);
  const open = addonModal === 'seats';

  const { data: addonsResult, isLoading: isAddonsLoading } = useAddonsStatus();
  const addonsData = addonsResult?.success ? addonsResult.data : null;
  const { mutate: openCustomerPortal, isPending: isPortalPending } = useOpenCustomerPortal();

  const [state, setState] = useState<ModalState>('loading');
  const [previewData, setPreviewData] = useState<PlanChangePreviewData | null>(null);
  const [errorInfo, setErrorInfo] = useState<AddonErrorInfo>({ message: '' });
  const [currentQuantity, setCurrentQuantity] = useState(0);
  const [newQuantity, setNewQuantity] = useState(0);

  const inputReady = open && !!workspaceId && !!addonsData;
  const hasUnsavedChange = newQuantity !== currentQuantity;

  const { mutate: manageAddons, isPending } = useManageAddons({
    onPreview: (data) => {
      setPreviewData(data);
      setState('preview');
    },
    onExecute: () => {
      setState('success');
    },
    onError: (error) => {
      const code = error.data?.code || error.code;
      const message =
        code === 'BILLING_MANAGEMENT_UNAVAILABLE_FOR_MEMBER'
          ? 'Only workspace owners and admins can change billing add-ons.'
          : error.data?.message || error.message || 'Failed to change add-ons.';
      setErrorInfo({ message, code });
      setState('error');
    },
  });

  useEffect(() => {
    if (!open) return;
    if (isAddonsLoading) {
      setState('loading');
      return;
    }
    if (addonsData) {
      const initialSeatsQuantity = Math.min(addonsData.seatsQuantity, MAX_SEAT_PACKS);
      setCurrentQuantity(initialSeatsQuantity);
      setNewQuantity(initialSeatsQuantity);
      setPreviewData(null);
      setErrorInfo({ message: '' });
      setState('preview');
    }
  }, [open, addonsData, isAddonsLoading]);

  const triggerPreview = () => {
    if (!workspaceId) return;
    setState('loading');
    manageAddons({
      workspaceId,
      seatsQuantity: newQuantity,
      action: 'preview',
    });
  };

  const handleConfirm = () => {
    if (!workspaceId) return;
    setState('confirming');
    manageAddons({
      workspaceId,
      seatsQuantity: newQuantity,
      action: 'execute',
    });
  };

  const handleClose = () => {
    const wasSuccess = state === 'success';
    setAddonModal(null);
    if (wasSuccess) onComplete?.();
    setTimeout(() => {
      setState('loading');
      setPreviewData(null);
      setErrorInfo({ message: '' });
    }, 200);
  };

  return (
    <Sheet open={open} onOpenChange={() => handleClose()}>
      <SheetContent
        side="bottom"
        className="p-0 gap-0 max-h-[85vh] overflow-y-auto rounded-t-2xl"
        showCloseButton={true}
      >
        <SheetTitle className="sr-only">Billing Add-ons</SheetTitle>
        <SheetDescription className="sr-only">
          Manage and confirm seat add-on billing changes.
        </SheetDescription>

        {state === 'loading' && <LoadingView />}

        {(state === 'preview' || state === 'confirming') && previewData ? (
          <AddonPreviewView
            currentQuantity={currentQuantity}
            newQuantity={newQuantity}
            preview={previewData}
            isConfirming={state === 'confirming' || isPending}
            onConfirm={handleConfirm}
            onCancel={handleClose}
          />
        ) : null}

        {state === 'preview' && !previewData && inputReady ? (
          <EditView
            currentQuantity={currentQuantity}
            newQuantity={newQuantity}
            hasUnsavedChange={hasUnsavedChange}
            isSubmitting={isPending}
            onDecrease={() => setNewQuantity((prev) => Math.max(0, prev - 1))}
            onIncrease={() => setNewQuantity((prev) => Math.min(MAX_SEAT_PACKS, prev + 1))}
            onPreview={triggerPreview}
            onCancel={handleClose}
          />
        ) : null}

        {state === 'success' ? (
          <SuccessView
            currentQuantity={currentQuantity}
            newQuantity={newQuantity}
            preview={previewData}
            onClose={handleClose}
            onOpenPortal={() => openCustomerPortal()}
            isPortalLoading={isPortalPending}
          />
        ) : null}

        {state === 'error' ? (
          <ErrorView
            error={errorInfo}
            onClose={handleClose}
            onOpenPortal={() => openCustomerPortal()}
            isPortalLoading={isPortalPending}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
