'use client';

import {
  BASE_PRICING_PLANS,
  type BasePricingPlan,
  filterPlansByCycle,
  formatPlanRate,
  PLAN_CARD_HIGHLIGHTS,
  type PlanCycle,
  type PlanName,
} from '@workspace/pricing';
import { Dialog, DialogContent, DialogTitle } from '@workspace/ui/components/dialog';
import { Check } from 'lucide-react';
import { useState } from 'react';

import { env } from '@/env';

interface PlanUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanName: PlanName;
  onUpgrade?: (planId: string) => void;
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
}: PlanUpgradeModalProps) {
  const [billingCycle, setBillingCycle] = useState<PlanCycle>('annual');
  const defaultSelection = currentPlanName === 'Starter' ? 'left' : 'right';
  const [selectedPlan, setSelectedPlan] = useState<'left' | 'right'>(defaultSelection);

  const config = getPlansToShow(currentPlanName, billingCycle);
  if (!config) return null;

  const { left, right, leftIsCurrent, rightIsCurrent } = config;
  const isAnnual = billingCycle === 'annual';
  const isSelectable = currentPlanName !== 'Scale Up';

  const leftHighlights = PLAN_CARD_HIGHLIGHTS[left.name] || [];
  const rightHighlights = PLAN_CARD_HIGHLIGHTS[right.name] || [];
  const maxHighlights = Math.max(leftHighlights.length, rightHighlights.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 gap-0 overflow-hidden" showCloseButton={false}>
        <DialogTitle className="sr-only">Upgrade Plan</DialogTitle>
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
              onUpgrade={onUpgrade}
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
              onUpgrade={onUpgrade}
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
      </DialogContent>
    </Dialog>
  );
}
