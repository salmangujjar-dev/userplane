'use client';

import { getSlugFromPlanId, type SubscriptionPreviewChangePlanResponse } from '@workspace/payments';
import {
  BASE_PRICING_PLANS,
  type BasePricingPlan,
  filterPlansByCycle,
  formatPlanRate,
  PLAN_CARD_HIGHLIGHTS,
  type PlanCycle,
  type PlanId,
  type PlanName,
} from '@workspace/pricing';
import { Dialog, DialogContent, DialogTitle } from '@workspace/ui/components/dialog';
import { Check, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

import { env } from '@/env';
import { usePreviewPlanChange } from '@/queries/use-billing-queries';

interface PlanUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanName: PlanName;
  onUpgrade?: (planId: string) => void;
  onUpgradeSuccess?: () => void;
  hasActiveSubscription?: boolean;
}

interface PlanHighlightProps {
  text: string;
}

function PlanHighlight({ text }: PlanHighlightProps) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
      <span className="text-zinc-700">{text}</span>
    </li>
  );
}

interface BillingToggleProps {
  cycle: PlanCycle;
  onCycleChange: (cycle: PlanCycle) => void;
}

function BillingToggle({ cycle, onCycleChange }: BillingToggleProps) {
  return (
    <div className="flex items-center justify-center">
      <div className="bg-zinc-100 rounded-full p-1 flex">
        <button
          onClick={() => onCycleChange('monthly')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
            cycle === 'monthly'
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => onCycleChange('annual')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
            cycle === 'annual'
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Annual
          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
            Save 20%
          </span>
        </button>
      </div>
    </div>
  );
}

interface PlanCardProps {
  plan: BasePricingPlan;
  highlights: string[];
  isCurrent: boolean;
  isSelected: boolean;
  isSelectable: boolean;
  showCheckoutButton: boolean;
  isAnnual: boolean;
  minHighlights: number;
  onSelect?: () => void;
  onUpgrade?: (planId: string) => void;
}

function PlanCard({
  plan,
  highlights,
  isCurrent,
  isSelected,
  isSelectable,
  showCheckoutButton,
  isAnnual,
  minHighlights,
  onSelect,
  onUpgrade,
}: PlanCardProps) {
  const { name, description, details, isPopular } = plan;
  const displayRate = formatPlanRate(plan);
  const isCustom = details.planRate === null;
  const isFree = details.planRate === 0;

  const getBillingText = () => {
    if (isCustom || isFree) return 'Billed annually';
    return isAnnual ? 'Billed annually' : 'Billed monthly';
  };

  const minHeight = minHighlights * 28 + (minHighlights - 1) * 12;

  return (
    <div
      onClick={isSelectable ? onSelect : undefined}
      className={`flex flex-col rounded-2xl p-6 relative bg-white border transition-all ${
        isSelectable ? 'cursor-pointer' : ''
      } ${
        isSelected
          ? 'border-blue-300 shadow-lg shadow-blue-100/50'
          : 'border-zinc-200 hover:border-zinc-300'
      }`}
    >
      {isCurrent && (
        <div className="absolute -top-3 left-4">
          <span className="bg-white text-muted-foreground border border-zinc-200 px-2.5 py-1 rounded-md text-xs font-medium shadow-sm">
            Current plan
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xl font-semibold text-foreground">{name}</h3>
        {isPopular && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            Popular
          </span>
        )}
      </div>

      <div className="mb-2">
        {isCustom ? (
          <div className="text-4xl font-bold text-foreground">Custom</div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-foreground">{displayRate}</span>
            {!isFree && <span className="text-muted-foreground text-sm">/month</span>}
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4">{getBillingText()}</p>

      <p className="text-sm text-muted-foreground mb-6">{description}</p>

      <ul className="space-y-3 flex-1 mb-2" style={{ minHeight: `${minHeight}px` }}>
        {highlights.map((highlight, index) => (
          <PlanHighlight key={index} text={highlight} />
        ))}
      </ul>

      {showCheckoutButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUpgrade?.(plan.id);
          }}
          className={`w-full rounded-full px-6 py-2.5 font-medium transition-colors ${
            isSelected
              ? 'bg-foreground text-background hover:bg-foreground/90'
              : 'bg-white text-foreground border border-zinc-300 hover:bg-zinc-50'
          }`}
        >
          {isCustom ? 'Talk to sales' : 'Continue to checkout'}
        </button>
      )}
    </div>
  );
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface PreviewViewProps {
  preview: SubscriptionPreviewChangePlanResponse;
  planName: string;
  onConfirm: () => void;
  onBack: () => void;
  isConfirming: boolean;
}

interface SuccessViewProps {
  planName: string;
  recurringAmount: string;
  nextBillingDate: string;
  billingFrequency: string;
  onClose: () => void;
}

function SuccessView({
  planName,
  recurringAmount,
  nextBillingDate,
  billingFrequency,
  onClose,
}: SuccessViewProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Set initial window size
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // Update on resize
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);

    // Stop confetti after 3 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}
      <div className="px-6 pb-6 pt-12">
        <div className="max-w-md mx-auto text-center space-y-8">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-10 h-10 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-foreground">Upgrade Complete!</h3>
            <p className="text-base text-muted-foreground">
              Your workspace has been successfully upgraded to{' '}
              <span className="font-semibold text-foreground">{planName}</span>
            </p>
          </div>

          {/* Plan Details Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-left space-y-4">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Your New Subscription
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-zinc-700">Recurring Amount</span>
                <span className="text-sm font-semibold text-foreground">
                  {recurringAmount}/{billingFrequency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-700">Next Billing Date</span>
                <span className="text-sm font-semibold text-foreground">{nextBillingDate}</span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full rounded-full px-6 py-3 font-medium transition-colors bg-foreground text-background hover:bg-foreground/90"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}

function PreviewView({ preview, planName, onConfirm, onBack, isConfirming }: PreviewViewProps) {
  const { immediate_charge, new_plan } = preview;
  const { summary, line_items } = immediate_charge;

  // Use summary.currency as fallback if new_plan.currency is not available
  const currency = new_plan.currency || summary.currency;

  const getLineItemAmount = (item: (typeof line_items)[number]): number => {
    if (item.type === 'meter') {
      return item.subtotal;
    }
    return item.unit_price * item.quantity * item.proration_factor;
  };

  const getLineItemName = (item: (typeof line_items)[number]): string => {
    if ('name' in item && item.name) return item.name;
    if ('description' in item && item.description) return item.description;
    return 'Subscription';
  };

  return (
    <div className="px-6 pb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Panel */}
        <div className="flex flex-col h-full md:col-span-1">
          {/* Header with Back Button */}
          <div className="flex items-center gap-2 mb-8 pt-6">
            <button
              onClick={onBack}
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
            <h3 className="text-base font-semibold text-foreground">Review your upgrade</h3>
          </div>

          {/* Plan & Billing Info */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-600">Plan</span>
              <span className="text-sm text-foreground font-semibold">{planName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-600">Billing</span>
              <span className="text-sm text-foreground font-semibold capitalize">
                {new_plan.payment_frequency_interval || 'monthly'}
              </span>
            </div>
          </div>

          {/* Spacer to push content to bottom */}
          <div className="flex-1" />

          {/* How Your Upgrade Works */}
          <div className="pb-6">
            <h4 className="text-base font-semibold text-foreground mb-4">How your upgrade works</h4>

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
                      {formatDate(new_plan.next_billing_date)}
                    </span>
                    , you&apos;ll be charged{' '}
                    <span className="font-semibold text-foreground">
                      {formatCurrency(new_plan.recurring_pre_tax_amount, currency)}
                    </span>{' '}
                    per {(new_plan.payment_frequency_interval || 'month').toLowerCase()}.
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
                {formatCurrency(summary.total_amount, summary.currency)}
              </div>
            </div>

            {/* Proration Details */}
            <div className="mb-6">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                Proration Details
              </div>
              <div className="space-y-3">
                {line_items.map((item, i) => (
                  <div key={i} className="flex justify-between items-start">
                    <span className="text-sm text-zinc-700">{getLineItemName(item)}</span>
                    <span className="text-sm font-semibold text-foreground ml-4 text-right">
                      {formatCurrency(getLineItemAmount(item), summary.currency)}
                    </span>
                  </div>
                ))}
                {summary.tax !== null && summary.tax !== undefined && summary.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-700">Tax</span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(summary.tax, summary.currency)}
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
                    {formatCurrency(new_plan.recurring_pre_tax_amount, currency)}/
                    {(new_plan.payment_frequency_interval || 'month').toLowerCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-700">Next Billing Date</span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatDate(new_plan.next_billing_date)}
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

function getPlansToShow(currentPlanName: PlanName, cycle: PlanCycle) {
  const plans = filterPlansByCycle(BASE_PRICING_PLANS, cycle);
  const getPlan = (name: PlanName) => plans.find((p) => p.name === name);

  const starter = getPlan('Starter');
  const scaleUp = getPlan('Scale Up');
  const enterprise = getPlan('Enterprise');

  if (!starter || !scaleUp || !enterprise) return null;

  // Starter users see Scaleup and Enterprise
  if (currentPlanName === 'Starter') {
    return { left: scaleUp, right: enterprise, leftIsCurrent: false, rightIsCurrent: false };
  }

  // Scaleup users see Scaleup (current) and Enterprise
  if (currentPlanName === 'Scale Up') {
    return { left: scaleUp, right: enterprise, leftIsCurrent: true, rightIsCurrent: false };
  }

  // Everyone else sees Starter and Scaleup
  return { left: starter, right: scaleUp, leftIsCurrent: false, rightIsCurrent: false };
}

export function PlanUpgradeModal({
  open,
  onOpenChange,
  currentPlanName,
  onUpgrade,
  onUpgradeSuccess,
  hasActiveSubscription = false,
}: PlanUpgradeModalProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [billingCycle, setBillingCycle] = useState<PlanCycle>('annual');
  const defaultSelection = currentPlanName === 'Starter' ? 'left' : 'right';
  const [selectedPlan, setSelectedPlan] = useState<'left' | 'right'>(defaultSelection);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<SubscriptionPreviewChangePlanResponse | null>(
    null
  );
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const { mutate: previewChange, isPending: isPreviewLoading } = usePreviewPlanChange();

  // Reset state when modal opens or closes
  useEffect(() => {
    if (!open) {
      // Reset all states when modal closes
      setShowPreview(false);
      setPreviewData(null);
      setSelectedPlanId(null);
      setIsConfirming(false);
    }
  }, [open]);

  const config = getPlansToShow(currentPlanName, billingCycle);
  if (!config) return null;

  const { left, right, leftIsCurrent, rightIsCurrent } = config;
  const isAnnual = billingCycle === 'annual';
  const isSelectable = currentPlanName !== 'Scale Up';

  const leftHighlights = PLAN_CARD_HIGHLIGHTS[left.name] || [];
  const rightHighlights = PLAN_CARD_HIGHLIGHTS[right.name] || [];
  const maxHighlights = Math.max(leftHighlights.length, rightHighlights.length);

  const handlePlanUpgrade = (planId: string) => {
    if (!hasActiveSubscription) {
      // No active subscription, go directly to checkout
      onUpgrade?.(planId);
      return;
    }

    // Active subscription exists, show preview first
    const slug = getSlugFromPlanId(planId as PlanId);
    if (!slug) {
      console.error('No slug found for plan ID:', planId);
      return;
    }

    setSelectedPlanId(planId);
    previewChange(
      { planSlug: slug },
      {
        onSuccess: (result) => {
          if (result.alreadyOnPlan) {
            // Already on this plan, just close
            // Error handling is done by the mutation hook (usePreviewPlanChange)
            // which shows appropriate toast messages based on error type
            onOpenChange(false);
          } else if (result.preview) {
            // Show preview
            setPreviewData(result.preview);
            setShowPreview(true);
          }
        },
      }
    );

    // Show success view after a brief delay to simulate processing
    setTimeout(() => {
      setIsConfirming(false);
      setShowPreview(false);
      setShowSuccess(true);
      onUpgradeSuccess?.();
    }, 1500);
  };

  const handleConfirmChange = () => {
    if (!selectedPlanId) return;

    setIsConfirming(true);
    onUpgrade?.(selectedPlanId);
  };

  const handleBackToPlans = () => {
    setShowPreview(false);
    setPreviewData(null);
    setShowSuccess(false);
    setSelectedPlanId(null);
  };

  const handleSuccessClose = () => {
    onOpenChange(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      // Reset state when closing
      setShowPreview(false);
      setPreviewData(null);
      setSelectedPlanId(null);
      setIsConfirming(false);
    }
    onOpenChange(open);
  };

  const getSuccessDetails = () => {
    if (!previewData) return null;
    const { new_plan } = previewData;
    const currency = new_plan.currency || 'USD';
    return {
      recurringAmount: formatCurrency(new_plan.recurring_pre_tax_amount, currency),
      nextBillingDate: formatDate(new_plan.next_billing_date),
      billingFrequency: (new_plan.payment_frequency_interval || 'month').toLowerCase(),
    };
  };

  const successDetails = getSuccessDetails();

  const selectedPlanName =
    selectedPlanId === left.id ? left.name : selectedPlanId === right.id ? right.name : '';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={`p-0 gap-0 overflow-hidden ${showPreview || showSuccess ? 'sm:max-w-[900px]' : 'sm:max-w-[800px]'}`}
        showCloseButton={!isPreviewLoading && !isConfirming && !showPreview && !showSuccess}
      >
        <DialogTitle className="sr-only">
          {showSuccess ? 'Upgrade Complete' : showPreview ? 'Review Plan Change' : 'Upgrade Plan'}
        </DialogTitle>

        {showSuccess && successDetails ? (
          <SuccessView
            planName={selectedPlanName}
            recurringAmount={successDetails.recurringAmount}
            nextBillingDate={successDetails.nextBillingDate}
            billingFrequency={successDetails.billingFrequency}
            onClose={handleSuccessClose}
          />
        ) : showPreview && previewData ? (
          <PreviewView
            preview={previewData}
            planName={selectedPlanName}
            onConfirm={handleConfirmChange}
            onBack={handleBackToPlans}
            isConfirming={isConfirming}
          />
        ) : (
          <>
            <div className="p-6 pb-4">
              <BillingToggle cycle={billingCycle} onCycleChange={setBillingCycle} />
            </div>

            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PlanCard
                  plan={left}
                  highlights={leftHighlights}
                  isCurrent={leftIsCurrent}
                  isSelected={isSelectable ? selectedPlan === 'left' : !leftIsCurrent}
                  isSelectable={isSelectable}
                  showCheckoutButton={isSelectable ? selectedPlan === 'left' : !leftIsCurrent}
                  isAnnual={isAnnual}
                  minHighlights={maxHighlights}
                  onSelect={() => setSelectedPlan('left')}
                  onUpgrade={handlePlanUpgrade}
                />
                <PlanCard
                  plan={right}
                  highlights={rightHighlights}
                  isCurrent={rightIsCurrent}
                  isSelected={isSelectable ? selectedPlan === 'right' : !rightIsCurrent}
                  isSelectable={isSelectable}
                  showCheckoutButton={isSelectable ? selectedPlan === 'right' : !rightIsCurrent}
                  isAnnual={isAnnual}
                  minHighlights={maxHighlights}
                  onSelect={() => setSelectedPlan('right')}
                  onUpgrade={handlePlanUpgrade}
                />
              </div>
            </div>

            <div className="px-6 pb-6">
              <a
                href={`${env.home.url}/pricing`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground hover:underline font-medium block text-center"
              >
                See all plans
              </a>
            </div>
          </>
        )}

        {isPreviewLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-foreground" />
              <p className="text-sm text-muted-foreground">Loading preview...</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
