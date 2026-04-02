import {
  ADDITIONAL_RECORDINGS_OPTIONS,
  ADDITIONAL_SEATS_OPTIONS,
  BASE_PRICING_PLANS,
  CATEGORY_FEATURE_DEFINITIONS,
  FEATURE_CATEGORIES,
  FEATURE_CATEGORY_LABELS,
  type FeatureValue,
  filterPlansByCycle,
  formatPlanRate,
  PLAN_CARD_HIGHLIGHTS,
  PLAN_CATEGORY_FEATURES,
  SALES_FORM_URL,
} from '@userplane/pricing';
import type { APIRoute } from 'astro';

import { formatLlmsLinks } from '@/constants/llms';

function formatFeatureValue(value: FeatureValue): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  return String(value);
}

function buildContent(): string {
  const monthlyPlans = filterPlansByCycle(BASE_PRICING_PLANS, 'monthly');
  const annualPlans = filterPlansByCycle(BASE_PRICING_PLANS, 'annual');
  const planNames = monthlyPlans.map((p) => p.name);

  // Plan summaries
  const planSections = monthlyPlans
    .map((plan) => {
      const annual = annualPlans.find((a) => a.name === plan.name);
      const monthlyPrice = formatPlanRate(plan);
      const annualPrice = annual ? formatPlanRate(annual) : null;

      let priceLabel: string;
      if (monthlyPrice === 'Custom') {
        priceLabel = 'Custom Pricing';
      } else if (annualPrice) {
        priceLabel = `${monthlyPrice}/mo (${annualPrice}/mo annual)`;
      } else {
        priceLabel = `${monthlyPrice}/mo`;
      }

      const popular = plan.isPopular ? ' — Most Popular' : '';
      const heading = `### ${plan.name} — ${priceLabel}${popular}`;
      const description = `*${plan.description}.*`;

      const highlights = PLAN_CARD_HIGHLIGHTS[plan.name];
      const items = highlights ? highlights.map((h) => `- ${h}`).join('\n') : '';

      const enterpriseCta = plan.isEnterprise
        ? `\n\n[Request Enterprise access](${SALES_FORM_URL})`
        : '';

      return `${heading}\n${description}\n\n${items}${enterpriseCta}`;
    })
    .join('\n\n');

  // Feature comparison tables
  const comparisonSections = FEATURE_CATEGORIES.filter(
    (category) => CATEGORY_FEATURE_DEFINITIONS[category].length > 0
  )
    .map((category) => {
      const label = FEATURE_CATEGORY_LABELS[category];
      const features = CATEGORY_FEATURE_DEFINITIONS[category];

      const header = `| Feature | ${planNames.join(' | ')} |`;
      const separator = `|---------|${planNames.map(() => '---------').join('|')}|`;

      const rows = features
        .map((feature) => {
          const values = planNames.map((planName) => {
            const planFeatures = PLAN_CATEGORY_FEATURES[planName];
            if (!planFeatures || !planFeatures[category]) return '—';
            const value = planFeatures[category][feature.key];
            return value === undefined ? '—' : formatFeatureValue(value);
          });
          return `| ${feature.name} | ${values.join(' | ')} |`;
        })
        .join('\n');

      return `### ${label}\n\n${header}\n${separator}\n${rows}`;
    })
    .join('\n\n');

  // Add-ons
  const recordingAddOns = ADDITIONAL_RECORDINGS_OPTIONS.map(
    (opt) => `${opt.recordings} recordings for $${opt.price}`
  ).join(' · ');

  const seatAddOns = ADDITIONAL_SEATS_OPTIONS.map((opt) => opt.label).join(' · ');

  return `# Userplane — Pricing

> Simple, transparent pricing. Choose the plan that fits your team. No hidden fees, no surprises. Cancel anytime.

Save 20% with annual billing. Every paid plan includes a 14-day free trial.

## Plans

${planSections}

## Feature Comparison

${comparisonSections}

## Add-Ons

- **Additional recordings**: ${recordingAddOns}
- **Additional seats**: ${seatAddOns}

---

For frequently asked questions about pricing, billing, and plans, see [userplane.io/faq.md](https://userplane.io/faq.md).

${formatLlmsLinks(['Pricing'])}`;
}

export const GET: APIRoute = () => {
  return new Response(buildContent(), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
