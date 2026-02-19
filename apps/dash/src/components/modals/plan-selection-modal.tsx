'use client';

import {
  BASE_PRICING_PLANS,
  type BasePricingPlan,
  filterPlansByCycle,
  formatPlanRate,
  PLAN_CARD_HIGHLIGHTS,
  type PlanCycle,
} from '@workspace/pricing';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import Logo from '@workspace/ui/components/logo';
import { Check } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useState } from 'react';

import { env } from '@/env';
import { planModalParser, upsellFeatureParser } from '@/lib/parsers';
import {
  RESOURCE_UPSELL_CONFIGS,
  UPSELL_CONFIGS,
  type UpsellFeatureKey,
} from '@/lib/upsell-config';

interface PlanSelectionModalProps {
  onPlanSelect: (planId: string) => void;
  defaultPlan?: string;
  currentPlanName: string | null;
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
  isCurrent: boolean;
  isAnnual: boolean;
  minHighlights: number;
  onSelect: () => void;
  onCheckout: () => void;
}

function PlanCard({
  plan,
  highlights,
  isSelected,
  isCurrent,
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
      onClick={isCurrent ? undefined : onSelect}
      className={`flex flex-col rounded-2xl p-6 relative bg-white border transition-all ${
        isCurrent
          ? 'border-zinc-200 cursor-default'
          : isSelected
            ? 'border-blue-300 shadow-lg shadow-blue-100/50 cursor-pointer'
            : 'border-zinc-200 hover:border-zinc-300 cursor-pointer'
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

      <p className="text-sm text-muted-foreground mb-3 min-h-10">{description}</p>

      <div className="h-9 mb-4">
        {isCurrent ? (
          <button
            disabled
            className="w-full h-full rounded-full px-4 py-2 text-sm font-medium border border-zinc-300 text-muted-foreground bg-white cursor-default"
          >
            Current
          </button>
        ) : (
          isSelected && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCheckout();
              }}
              className="w-full h-full rounded-full px-4 py-2 text-sm font-medium transition-colors bg-foreground text-background hover:bg-foreground/90"
            >
              {isCustom ? 'Talk to sales' : 'Continue'}
            </button>
          )
        )}
      </div>

      <ul className="space-y-3 flex-1" style={{ minHeight: `${minHeight}px` }}>
        {highlights.map((highlight, index) => (
          <PlanHighlight key={index} text={highlight} />
        ))}
      </ul>
    </div>
  );
}

export function PlanSelectionModal({
  onPlanSelect,
  defaultPlan = 'Scale Up',
  currentPlanName,
}: PlanSelectionModalProps) {
  const [planModal, setPlanModal] = useQueryState('plan-modal', planModalParser);
  const [upsellFeature, setUpsellFeature] = useQueryState('upsell-feature', upsellFeatureParser);
  const [billingCycle, setBillingCycle] = useState<PlanCycle>('annual');
  const [selectedPlanName, setSelectedPlanName] = useState<string>(defaultPlan);

  const upsellConfig = upsellFeature
    ? upsellFeature.startsWith('limit:')
      ? RESOURCE_UPSELL_CONFIGS[upsellFeature.slice('limit:'.length)]
      : UPSELL_CONFIGS[upsellFeature as UpsellFeatureKey]
    : undefined;

  const open = planModal !== null;
  const showAllPlans = planModal === 'detailed';

  const plans = filterPlansByCycle(BASE_PRICING_PLANS, billingCycle);
  const essential = plans.find((p) => p.name === 'Essential');
  const starter = plans.find((p) => p.name === 'Starter');
  const scaleUp = plans.find((p) => p.name === 'Scale Up');
  const enterprise = plans.find((p) => p.name === 'Enterprise');

  if (!starter || !scaleUp || !enterprise) return null;

  const isAnnual = billingCycle === 'annual';

  const essentialHighlights = PLAN_CARD_HIGHLIGHTS['Essential'] || [];
  const starterHighlights = PLAN_CARD_HIGHLIGHTS['Starter'] || [];
  const scaleUpHighlights = PLAN_CARD_HIGHLIGHTS['Scale Up'] || [];
  const enterpriseHighlights = PLAN_CARD_HIGHLIGHTS['Enterprise'] || [];

  const displayedHighlights = showAllPlans
    ? [essentialHighlights, starterHighlights, scaleUpHighlights, enterpriseHighlights]
    : [starterHighlights, scaleUpHighlights, enterpriseHighlights];

  const maxHighlights = Math.max(...displayedHighlights.map((h) => h.length));

  const getSelectedPlan = (): BasePricingPlan => {
    if (selectedPlanName === 'Essential' && essential) return essential;
    if (selectedPlanName === 'Starter') return starter;
    if (selectedPlanName === 'Scale Up') return scaleUp;
    if (selectedPlanName === 'Enterprise') return enterprise;
    return scaleUp;
  };

  const handleCheckout = () => {
    const selectedPlan = getSelectedPlan();
    onPlanSelect(selectedPlan.id);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setPlanModal(null);
      setUpsellFeature(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="p-0 gap-0 max-w-[calc(100%-2rem)] sm:max-w-6xl max-h-[85vh] overflow-y-auto"
        showCloseButton={true}
      >
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4 mb-6">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">
                {upsellConfig?.title ?? 'Choose Your Plan'}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {upsellConfig?.subtitle ?? 'Select the plan that best fits your needs'}
              </DialogDescription>
            </div>
          </div>

          <BillingToggle cycle={billingCycle} onCycleChange={setBillingCycle} />
        </div>

        <div className="px-6 pb-6">
          <div
            className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${showAllPlans ? 'lg:grid-cols-4' : 'md:grid-cols-3'}`}
          >
            {showAllPlans && essential && (
              <PlanCard
                plan={essential}
                highlights={essentialHighlights}
                isSelected={selectedPlanName === 'Essential'}
                isCurrent={currentPlanName === 'Essential'}
                isAnnual={isAnnual}
                minHighlights={maxHighlights}
                onSelect={() => setSelectedPlanName('Essential')}
                onCheckout={handleCheckout}
              />
            )}
            <PlanCard
              plan={starter}
              highlights={starterHighlights}
              isSelected={selectedPlanName === 'Starter'}
              isCurrent={currentPlanName === 'Starter'}
              isAnnual={isAnnual}
              minHighlights={maxHighlights}
              onSelect={() => setSelectedPlanName('Starter')}
              onCheckout={handleCheckout}
            />
            <PlanCard
              plan={scaleUp}
              highlights={scaleUpHighlights}
              isSelected={selectedPlanName === 'Scale Up'}
              isCurrent={currentPlanName === 'Scale Up'}
              isAnnual={isAnnual}
              minHighlights={maxHighlights}
              onSelect={() => setSelectedPlanName('Scale Up')}
              onCheckout={handleCheckout}
            />
            <PlanCard
              plan={enterprise}
              highlights={enterpriseHighlights}
              isSelected={selectedPlanName === 'Enterprise'}
              isCurrent={currentPlanName === 'Enterprise'}
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
