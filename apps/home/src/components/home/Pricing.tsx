import {
  createPricingPlans,
  formatPlanRate,
  type PlanCycle,
  type PlanFeature,
  PRICING_SUBTITLE,
  PRICING_TITLE,
  type PricingPlan,
} from '@workspace/pricing';
import { useState } from 'react';

import { SIGNUP_URL } from '../../constants/onboarding';

const ALL_PLANS = createPricingPlans({ signupUrl: SIGNUP_URL, version: 'v1' });

interface PricingFeatureProps extends PlanFeature {
  isExpanded: boolean;
  onToggle: () => void;
}

function PricingFeature({
  text,
  included,
  subFeatures,
  isExpanded,
  onToggle,
}: PricingFeatureProps) {
  if (subFeatures && subFeatures.length > 0) {
    return (
      <li className="flex flex-col">
        <button
          onClick={onToggle}
          className="flex items-center gap-3 text-sm w-full text-left hover:opacity-80 transition-opacity"
        >
          <svg
            className={`w-5 h-5 shrink-0 ${included ? 'text-green-500' : 'text-gray-300'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="flex-1">{text}</span>
          <svg
            className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
          }`}
        >
          <ul className="ml-8 space-y-2">
            {subFeatures.map((subFeature, index) => (
              <li key={index} className="flex items-center gap-3 text-sm">
                <svg
                  className={`w-4 h-4 shrink-0 ${subFeature.included ? 'text-green-500' : 'text-gray-300'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {subFeature.text}
              </li>
            ))}
          </ul>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 text-sm">
      <svg
        className={`w-5 h-5 shrink-0 ${included ? 'text-green-500' : 'text-gray-300'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      {text}
    </li>
  );
}

interface BillingToggleProps {
  cycle: PlanCycle;
  onCycleChange: (cycle: PlanCycle) => void;
}

function BillingToggle({ cycle, onCycleChange }: BillingToggleProps) {
  return (
    <div className="flex items-center justify-center mb-12">
      <div className="bg-gray-100 rounded-lg p-1 flex">
        <button
          onClick={() => onCycleChange('annual')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            cycle === 'annual'
              ? 'bg-white text-black shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Annual
          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
            3 months off
          </span>
        </button>
        <button
          onClick={() => onCycleChange('monthly')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
            cycle === 'monthly'
              ? 'bg-white text-black shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Monthly
        </button>
      </div>
    </div>
  );
}

interface PricingPlanCardProps {
  plan: PricingPlan;
  expandedIndex: number | null;
  onToggle: (index: number) => void;
}

function PricingPlanCard({ plan, expandedIndex, onToggle }: PricingPlanCardProps) {
  const { name, description, details, features, ctaText, ctaUrl, ctaIsExternal, isPopular } = plan;
  const displayRate = formatPlanRate(plan);
  const isCustom = details.planRate === null;

  return (
    <div
      className={`flex flex-col ${
        isPopular ? 'bg-black text-white shadow-xl' : 'bg-white border border-zinc-200 shadow-sm'
      } rounded-xl p-8 relative`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          Most Popular
        </div>
      )}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">{name}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{displayRate}</span>
          {!isCustom && (
            <span className={isPopular ? 'text-gray-400' : 'text-gray-500'}>
              /{details.planCycle === 'annual' ? 'month' : 'month'}
            </span>
          )}
        </div>
        <p className={`mt-4 text-sm ${isPopular ? 'text-gray-400' : 'text-gray-600'}`}>
          {description}
        </p>
      </div>
      <ul className="space-y-4 mb-8 flex-1">
        {features.map((feature, index) => (
          <PricingFeature
            key={index}
            {...feature}
            isExpanded={expandedIndex === index}
            onToggle={() => onToggle(index)}
          />
        ))}
      </ul>
      <a
        href={ctaUrl}
        target={ctaIsExternal ? '_blank' : undefined}
        rel={ctaIsExternal ? 'noopener noreferrer' : undefined}
        className={`w-full cursor-pointer min-h-[48px] flex items-center justify-center ${
          isPopular
            ? 'bg-white text-black hover:bg-gray-100'
            : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
        } px-6 py-3 rounded-md font-medium transition-colors`}
      >
        {ctaText}
      </a>
    </div>
  );
}

export default function Pricing() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<PlanCycle>('annual');

  const handleToggle = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const filteredPlans = ALL_PLANS.filter((plan) => plan.details.planCycle === billingCycle);

  return (
    <section className="py-16 md:py-24 px-6 md:px-12 scroll-mt-20" id="pricing">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <div className="flex flex-col gap-8">
          <p className="text-center text-base text-muted-foreground md:text-lg">{PRICING_TITLE}</p>
          <h2 className="mx-auto max-w-2xl text-center font-dm-sans font-medium text-2xl text-foreground leading-normal tracking-tight md:text-3xl lg:text-4xl">
            {PRICING_SUBTITLE}
          </h2>
        </div>
      </div>

      <BillingToggle cycle={billingCycle} onCycleChange={setBillingCycle} />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {filteredPlans.map((plan) => (
          <PricingPlanCard
            key={plan.id}
            plan={plan}
            expandedIndex={expandedIndex}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </section>
  );
}
