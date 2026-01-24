'use client';

import {
  BASE_PRICING_PLANS,
  type BasePricingPlan,
  filterPlansByCycle,
  formatPlanRate,
  PLAN_CARD_HIGHLIGHTS,
  type PlanCycle,
} from '@workspace/pricing';
import { Dialog, DialogContent, DialogTitle } from '@workspace/ui/components/dialog';
import { Check } from 'lucide-react';
import { useState } from 'react';

import { env } from '@/env';

interface PlanSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanSelect: (planId: string) => void;
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
  isSelected: boolean;
  isAnnual: boolean;
  minHighlights: number;
  onSelect: () => void;
  onCheckout: () => void;
}

function PlanCard({
  plan,
  highlights,
  isSelected,
  isAnnual,
  minHighlights,
  onSelect,
  onCheckout,
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
      onClick={onSelect}
      className={`flex flex-col rounded-2xl p-6 relative bg-white border transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-300 shadow-lg shadow-blue-100/50'
          : 'border-zinc-200 hover:border-zinc-300'
      }`}
    >
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

      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCheckout();
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

export function PlanSelectionModal({ open, onOpenChange, onPlanSelect }: PlanSelectionModalProps) {
  const [billingCycle, setBillingCycle] = useState<PlanCycle>('annual');
  const [selectedPlanName, setSelectedPlanName] = useState<string>('Scale Up');

  const plans = filterPlansByCycle(BASE_PRICING_PLANS, billingCycle);
  const starter = plans.find((p) => p.name === 'Starter');
  const scaleUp = plans.find((p) => p.name === 'Scale Up');
  const enterprise = plans.find((p) => p.name === 'Enterprise');

  if (!starter || !scaleUp || !enterprise) return null;

  const isAnnual = billingCycle === 'annual';

  const starterHighlights = PLAN_CARD_HIGHLIGHTS['Starter'] || [];
  const scaleUpHighlights = PLAN_CARD_HIGHLIGHTS['Scale Up'] || [];
  const enterpriseHighlights = PLAN_CARD_HIGHLIGHTS['Enterprise'] || [];

  const maxHighlights = Math.max(
    starterHighlights.length,
    scaleUpHighlights.length,
    enterpriseHighlights.length
  );

  const getSelectedPlan = () => {
    if (selectedPlanName === 'Starter') return starter;
    if (selectedPlanName === 'Scale Up') return scaleUp;
    if (selectedPlanName === 'Enterprise') return enterprise;
    return scaleUp;
  };

  const handleCheckout = () => {
    const selectedPlan = getSelectedPlan();
    onPlanSelect(selectedPlan.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-[1000px]">
        <DialogTitle className="sr-only">Choose Your Plan</DialogTitle>

        <div className="p-6 pb-4">
          <BillingToggle cycle={billingCycle} onCycleChange={setBillingCycle} />
        </div>

        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PlanCard
              plan={starter}
              highlights={starterHighlights}
              isSelected={selectedPlanName === 'Starter'}
              isAnnual={isAnnual}
              minHighlights={maxHighlights}
              onSelect={() => setSelectedPlanName('Starter')}
              onCheckout={handleCheckout}
            />
            <PlanCard
              plan={scaleUp}
              highlights={scaleUpHighlights}
              isSelected={selectedPlanName === 'Scale Up'}
              isAnnual={isAnnual}
              minHighlights={maxHighlights}
              onSelect={() => setSelectedPlanName('Scale Up')}
              onCheckout={handleCheckout}
            />
            <PlanCard
              plan={enterprise}
              highlights={enterpriseHighlights}
              isSelected={selectedPlanName === 'Enterprise'}
              isAnnual={isAnnual}
              minHighlights={maxHighlights}
              onSelect={() => setSelectedPlanName('Enterprise')}
              onCheckout={handleCheckout}
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
