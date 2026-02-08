'use client';

import {
  BASE_PRICING_PLANS,
  type BasePricingPlan,
  CATEGORY_FEATURE_DEFINITIONS,
  FEATURE_CATEGORIES,
  FEATURE_CATEGORY_LABELS,
  type FeatureCategory,
  type FeatureValue,
  filterPlansByCycle,
  formatPlanRate,
  PLAN_CARD_HIGHLIGHTS,
  PLAN_CATEGORY_FEATURES,
  type PlanCycle,
  SALES_FORM_URL,
} from '@workspace/pricing';
import { Button } from '@workspace/ui/components/button';
import { Check, ChevronDown, Minus, Plus, X } from 'lucide-react';
import { Fragment, useState } from 'react';

import { SIGNUP_URL } from '@/constants/onboarding';
import {
  COMPARE_PLANS_HEADING,
  COMPARE_PLANS_HIGHLIGHTS,
  PRICING_FAQ_HEADING,
  PRICING_FAQ_HIGHLIGHTS,
  PRICING_FAQ_ITEMS,
  PRICING_PAGE_HEADING,
  PRICING_PAGE_HIGHLIGHTS,
  type PricingFAQItem,
} from '@/constants/pricing-page';

import Highlight from './Highlight';

// ============================================================================
// Billing Toggle Component
// ============================================================================

interface BillingToggleProps {
  cycle: PlanCycle;
  onCycleChange: (cycle: PlanCycle) => void;
}

function BillingToggle({ cycle, onCycleChange }: BillingToggleProps) {
  return (
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
  );
}

// ============================================================================
// Section Header Component
// ============================================================================

interface SectionHeaderProps {
  label: string;
  title: string;
  subtitle: string;
  highlights: { wordIndex: number; color: 'blue' | 'yellow' | 'green' | 'purple' }[];
}

function SectionHeader({ label, title, subtitle, highlights }: SectionHeaderProps) {
  const words = title.split(' ');
  const highlightMap = new Map(highlights.map((h) => [h.wordIndex, h.color]));

  return (
    <div className="text-center mb-16">
      <div className="flex flex-col gap-8">
        <p className="text-center text-base text-muted-foreground md:text-lg">{label}</p>
        <h2 className="font-dm-sans font-medium text-4xl text-foreground tracking-tighter md:text-5xl lg:text-6xl leading-tight">
          {words.map((word, index) => {
            const color = highlightMap.get(index);
            return (
              <span key={index}>{color ? <Highlight color={color}>{word}</Highlight> : word} </span>
            );
          })}
        </h2>
        <p className="md:text-lg max-w-2xl mx-auto text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

// ============================================================================
// Plan Card Component
// ============================================================================

interface PlanCardProps {
  plan: BasePricingPlan;
  highlights: string[];
  isAnnual: boolean;
}

function PlanCard({ plan, highlights, isAnnual }: PlanCardProps) {
  const { name, description, details, isPopular, isEnterprise } = plan;
  const displayRate = formatPlanRate(plan);
  const isCustom = details.planRate === null;

  const ctaText = isEnterprise ? 'Talk to sales' : 'Get started';
  const ctaUrl = isEnterprise ? SALES_FORM_URL : SIGNUP_URL;
  const isExternal = isEnterprise;

  return (
    <div
      className={`flex flex-col rounded-2xl p-6 relative bg-white border transition-all ${
        isPopular ? 'border-blue-300 shadow-lg shadow-blue-100/50' : 'border-zinc-200'
      }`}
    >
      {/* Plan Name & Popular Badge */}
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xl font-semibold text-foreground">{name}</h3>
        {isPopular && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            Popular
          </span>
        )}
      </div>

      {/* Price */}
      <div className="mb-2">
        {isCustom ? (
          <div className="text-4xl font-bold text-foreground">Custom</div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-foreground">{displayRate}</span>
            {details.planRate !== 0 && (
              <span className="text-muted-foreground text-sm">/month</span>
            )}
          </div>
        )}
      </div>

      {/* Billing info */}
      <p className="text-sm text-muted-foreground mb-4">
        {isCustom
          ? 'Billed annually'
          : details.planRate === 0
            ? 'Free forever'
            : isAnnual
              ? 'Per month, billed annually'
              : 'Billed monthly'}
      </p>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-6">{description}</p>

      {/* CTA Button */}
      <Button
        asChild
        className={`w-full rounded-full mb-6 ${
          isPopular
            ? 'bg-foreground text-background hover:bg-foreground/90'
            : 'bg-white text-foreground border border-zinc-300 hover:bg-zinc-50'
        }`}
        variant={isPopular ? 'default' : 'outline'}
      >
        <a
          href={ctaUrl}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
        >
          {ctaText}
        </a>
      </Button>

      {/* Features */}
      <ul className="space-y-3 flex-1">
        {highlights.map((feature, index) => (
          <li key={index} className="flex items-start gap-3 text-sm">
            <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <span className="text-zinc-700">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// Feature Comparison Table Component
// ============================================================================

interface FeatureValueCellProps {
  value: FeatureValue;
  isHighlighted?: boolean;
}

function FeatureValueCell({ value, isHighlighted }: FeatureValueCellProps) {
  const bgClass = isHighlighted ? 'bg-blue-50/50' : '';

  if (typeof value === 'boolean') {
    return (
      <td className={`px-4 py-3 text-center ${bgClass}`}>
        {value ? (
          <Check className="w-5 h-5 text-blue-500 mx-auto" />
        ) : (
          <X className="w-5 h-5 text-zinc-300 mx-auto" />
        )}
      </td>
    );
  }

  return (
    <td className={`px-4 py-3 text-center text-sm text-zinc-700 ${bgClass}`}>
      {value === '-' ? <span className="text-zinc-300">-</span> : value}
    </td>
  );
}

interface FeatureComparisonTableProps {
  cycle: PlanCycle;
  onCycleChange: (cycle: PlanCycle) => void;
}

// ---- Mobile: plan-selector + expandable feature categories ----

function MobileFeatureValueDisplay({ value }: { value: FeatureValue }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="w-4 h-4 text-blue-500" />
    ) : (
      <X className="w-4 h-4 text-zinc-300" />
    );
  }
  return (
    <span className="text-sm text-zinc-700">
      {value === '-' ? <span className="text-zinc-300">-</span> : value}
    </span>
  );
}

function MobileFeatureComparison({ cycle, onCycleChange }: FeatureComparisonTableProps) {
  const plans = filterPlansByCycle(BASE_PRICING_PLANS, cycle);
  const planNames = ['Essential', 'Starter', 'Scale Up', 'Enterprise'] as const;

  const displayPlans = planNames
    .map((name) => plans.find((p) => p.name === name))
    .filter((p): p is BasePricingPlan => p !== undefined);

  const [selectedPlanIdx, setSelectedPlanIdx] = useState(
    () => displayPlans.findIndex((p) => p.isPopular) ?? 0
  );
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    // Start with first category open
    () => new Set([FEATURE_CATEGORIES[0]])
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedPlan = displayPlans[selectedPlanIdx];
  if (!selectedPlan) return null;

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Billing toggle */}
      <div className="flex justify-center">
        <BillingToggle cycle={cycle} onCycleChange={onCycleChange} />
      </div>

      {/* Plan selector dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white border border-zinc-200 rounded-xl text-left"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{selectedPlan.name}</span>
            {selectedPlan.isPopular && (
              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                Popular
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              {formatPlanRate(selectedPlan)}
              {selectedPlan.details.planRate !== null &&
                selectedPlan.details.planRate !== 0 &&
                '/mo'}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-zinc-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden">
            {displayPlans.map((plan, idx) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => {
                  setSelectedPlanIdx(idx);
                  setDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-zinc-50 transition-colors ${
                  idx === selectedPlanIdx ? 'bg-zinc-50' : ''
                }`}
              >
                <span className="font-medium text-foreground">{plan.name}</span>
                {plan.isPopular && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                    Popular
                  </span>
                )}
                <span className="text-sm text-muted-foreground ml-auto">
                  {formatPlanRate(plan)}
                  {plan.details.planRate !== null && plan.details.planRate !== 0 && '/mo'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CTA for selected plan */}
      <Button
        asChild
        className={`w-full rounded-full ${
          selectedPlan.isPopular
            ? 'bg-foreground text-background hover:bg-foreground/90'
            : 'bg-white text-foreground border border-zinc-300 hover:bg-zinc-50'
        }`}
        variant={selectedPlan.isPopular ? 'default' : 'outline'}
      >
        <a
          href={selectedPlan.isEnterprise ? SALES_FORM_URL : SIGNUP_URL}
          target={selectedPlan.isEnterprise ? '_blank' : undefined}
          rel={selectedPlan.isEnterprise ? 'noopener noreferrer' : undefined}
        >
          {selectedPlan.isEnterprise ? 'Talk to sales' : 'Get started'}
        </a>
      </Button>

      {/* Feature categories (accordion) */}
      <div className="flex flex-col">
        {FEATURE_CATEGORIES.map((category) => {
          const features = CATEGORY_FEATURE_DEFINITIONS[category];
          const categoryLabel = FEATURE_CATEGORY_LABELS[category];
          const isOpen = openCategories.has(category);
          const planFeatures = PLAN_CATEGORY_FEATURES[selectedPlan.name];

          return (
            <div key={category} className="border-b border-zinc-100 last:border-b-0">
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50/80 hover:bg-zinc-100/80 transition-colors"
              >
                <span className="text-sm font-semibold text-zinc-900">{categoryLabel}</span>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <div className="flex flex-col">
                  {features.map((feature) => {
                    const value = planFeatures?.[category]?.[feature.key] ?? false;
                    return (
                      <div
                        key={feature.key}
                        className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-50 last:border-b-0"
                      >
                        <span className="text-sm text-zinc-700">{feature.name}</span>
                        <MobileFeatureValueDisplay value={value} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Desktop: full comparison table ----

function DesktopFeatureComparisonTable({ cycle, onCycleChange }: FeatureComparisonTableProps) {
  const plans = filterPlansByCycle(BASE_PRICING_PLANS, cycle);

  const getPlan = (name: string): BasePricingPlan | undefined => {
    return plans.find((p) => p.name === name);
  };

  const essentialPlan = getPlan('Essential');
  const starterPlan = getPlan('Starter');
  const scaleUpPlan = getPlan('Scale Up');
  const enterprisePlan = getPlan('Enterprise');

  if (!essentialPlan || !starterPlan || !scaleUpPlan || !enterprisePlan) {
    return null;
  }

  const displayPlans = [essentialPlan, starterPlan, scaleUpPlan, enterprisePlan];
  const planNames = ['Essential', 'Starter', 'Scale Up', 'Enterprise'];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        {/* Header with plan names */}
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="px-4 py-4 text-left w-1/5">
              <BillingToggle cycle={cycle} onCycleChange={onCycleChange} />
            </th>
            {displayPlans.map((plan) => (
              <th
                key={plan.id}
                className={`px-4 py-4 text-center ${plan.isPopular ? 'bg-blue-50/50' : ''}`}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-foreground">{plan.name}</span>
                    {plan.isPopular && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        Popular
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatPlanRate(plan)}
                    {plan.details.planRate !== null && plan.details.planRate !== 0 && ' /month'}
                  </span>
                  <Button
                    asChild
                    size="sm"
                    className={`mt-2 rounded-full ${
                      plan.isPopular
                        ? 'bg-foreground text-background hover:bg-foreground/90'
                        : 'bg-white text-foreground border border-zinc-300 hover:bg-zinc-50'
                    }`}
                    variant={plan.isPopular ? 'default' : 'outline'}
                  >
                    <a
                      href={plan.isEnterprise ? SALES_FORM_URL : SIGNUP_URL}
                      target={plan.isEnterprise ? '_blank' : undefined}
                      rel={plan.isEnterprise ? 'noopener noreferrer' : undefined}
                    >
                      {plan.isEnterprise ? 'Talk to sales' : 'Get started'}
                    </a>
                  </Button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURE_CATEGORIES.map((category: FeatureCategory) => {
            const features = CATEGORY_FEATURE_DEFINITIONS[category];
            const categoryLabel = FEATURE_CATEGORY_LABELS[category];

            return (
              <Fragment key={category}>
                {/* Category Header */}
                <tr className="bg-zinc-50">
                  <td colSpan={5} className="px-4 py-3">
                    <span className="text-sm font-semibold text-zinc-900">{categoryLabel}</span>
                  </td>
                </tr>
                {/* Category Features */}
                {features.map((feature) => (
                  <tr key={feature.key} className="border-b border-zinc-100 last:border-b-0">
                    <td className="px-4 py-3 text-sm text-zinc-700">{feature.name}</td>
                    {planNames.map((planName, idx) => {
                      const planFeatures = PLAN_CATEGORY_FEATURES[planName];
                      const value = planFeatures?.[category]?.[feature.key] ?? false;
                      const isHighlighted = planName === 'Scale Up';
                      return (
                        <FeatureValueCell
                          key={`${feature.key}-${idx}`}
                          value={value}
                          isHighlighted={isHighlighted}
                        />
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---- Responsive wrapper: mobile vs desktop ----

function FeatureComparisonTable({ cycle, onCycleChange }: FeatureComparisonTableProps) {
  return (
    <>
      {/* Mobile: plan selector + accordion */}
      <div className="block md:hidden p-4">
        <MobileFeatureComparison cycle={cycle} onCycleChange={onCycleChange} />
      </div>
      {/* Desktop: full comparison table */}
      <div className="hidden md:block">
        <DesktopFeatureComparisonTable cycle={cycle} onCycleChange={onCycleChange} />
      </div>
    </>
  );
}

// ============================================================================
// FAQ Section Component
// ============================================================================

interface FAQAccordionItemProps {
  item: PricingFAQItem;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQAccordionItem({ item, isOpen, onToggle }: FAQAccordionItemProps) {
  return (
    <div className="border-b border-zinc-200 last:border-b-0 w-full min-w-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-6 text-left hover:opacity-80 transition-opacity min-w-0"
      >
        <h3 className="text-lg font-medium text-zinc-900 flex-1 min-w-0">{item.question}</h3>
        <div className="shrink-0 flex-none">
          {isOpen ? (
            <Minus className="w-5 h-5 text-zinc-600" />
          ) : (
            <Plus className="w-5 h-5 text-zinc-600" />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="pb-6 w-full min-w-0 overflow-hidden pr-8">
          <p className="text-base text-zinc-600 leading-relaxed">{item.answer}</p>
        </div>
      )}
    </div>
  );
}

function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <SectionHeader
        label={PRICING_FAQ_HEADING.label}
        title={PRICING_FAQ_HEADING.title}
        subtitle={PRICING_FAQ_HEADING.subtitle}
        highlights={PRICING_FAQ_HIGHLIGHTS}
      />

      <div className="bg-white rounded-2xl border border-zinc-200 p-6 md:p-8 w-full min-w-0">
        {PRICING_FAQ_ITEMS.map((item, index) => (
          <FAQAccordionItem
            key={index}
            item={item}
            isOpen={openIndex === index}
            onToggle={() => toggleItem(index)}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Pricing Page Component
// ============================================================================

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<PlanCycle>('annual');

  const plans = filterPlansByCycle(BASE_PRICING_PLANS, billingCycle);

  // Get the plans we want to display (Essential, Starter, Scale Up, Enterprise)
  const displayPlans = ['Essential', 'Starter', 'Scale Up', 'Enterprise']
    .map((name) => plans.find((p) => p.name === name))
    .filter((p): p is BasePricingPlan => p !== undefined);

  const words = PRICING_PAGE_HEADING.title.split(' ');
  const highlightMap = new Map(PRICING_PAGE_HIGHLIGHTS.map((h) => [h.wordIndex, h.color]));

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="pt-16 md:pt-24 pb-12 px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex flex-col gap-6">
            <p className="text-base text-muted-foreground md:text-lg">
              {PRICING_PAGE_HEADING.label}
            </p>
            <h1 className="font-dm-sans font-medium text-4xl text-foreground tracking-tighter md:text-5xl lg:text-6xl leading-tight">
              {words.map((word, index) => {
                const color = highlightMap.get(index);
                return (
                  <span key={index}>
                    {color ? <Highlight color={color}>{word}</Highlight> : word}{' '}
                  </span>
                );
              })}
            </h1>
            <p className="md:text-lg max-w-2xl mx-auto text-muted-foreground">
              {PRICING_PAGE_HEADING.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Billing Toggle */}
      <section className="pb-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex justify-center">
          <BillingToggle cycle={billingCycle} onCycleChange={setBillingCycle} />
        </div>
      </section>

      {/* Plan Cards */}
      <section className="pb-16 md:pb-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                highlights={PLAN_CARD_HIGHLIGHTS[plan.name] || []}
                isAnnual={billingCycle === 'annual'}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 md:py-24 px-6 md:px-12 bg-zinc-50/50 scroll-mt-20" id="compare">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            label={COMPARE_PLANS_HEADING.label}
            title={COMPARE_PLANS_HEADING.title}
            subtitle={COMPARE_PLANS_HEADING.subtitle}
            highlights={COMPARE_PLANS_HIGHLIGHTS}
          />

          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <FeatureComparisonTable cycle={billingCycle} onCycleChange={setBillingCycle} />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 px-6 md:px-12 w-full overflow-x-hidden" id="faq">
        <PricingFAQ />
      </section>
    </div>
  );
}
