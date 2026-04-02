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

import { FAQ_ITEMS } from '@/constants/faq';
import { FEATURES } from '@/constants/features';
import { HERO_DESCRIPTION, HERO_HEADING } from '@/constants/hero';
import { formatLlmsLinks } from '@/constants/llms';
import { PRICING_FAQ_ITEMS } from '@/constants/pricing-page';

function formatFeatureValue(value: FeatureValue): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  return String(value);
}

function buildContent(): string {
  const monthlyPlans = filterPlansByCycle(BASE_PRICING_PLANS, 'monthly');
  const annualPlans = filterPlansByCycle(BASE_PRICING_PLANS, 'annual');
  const planNames = monthlyPlans.map((p) => p.name);

  // --- Landing page content ---

  const featureSections = FEATURES.map(
    (feature) => `### ${feature.title}\n${feature.description}`
  ).join('\n\n');

  const planRows = monthlyPlans
    .map((plan) => {
      const annual = annualPlans.find((a) => a.name === plan.name);
      const monthlyPrice = formatPlanRate(plan);
      const annualPrice = annual ? formatPlanRate(annual) : null;
      const price =
        monthlyPrice === 'Custom'
          ? 'Custom'
          : annualPrice
            ? `${monthlyPrice}/mo (${annualPrice}/mo annual)`
            : `${monthlyPrice}/mo`;
      return `| ${plan.name} | ${price} | ${plan.description} |`;
    })
    .join('\n');

  // --- Pricing detail content ---

  const planSections = monthlyPlans
    .map((plan) => {
      const annual = annualPlans.find((a) => a.name === plan.name);
      const monthlyPrice = formatPlanRate(plan);
      const annualPrice = annual ? formatPlanRate(annual) : null;
      const priceLabel =
        monthlyPrice === 'Custom'
          ? 'Custom Pricing'
          : annualPrice
            ? `${monthlyPrice}/mo (${annualPrice}/mo annual)`
            : `${monthlyPrice}/mo`;
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

  const recordingAddOns = ADDITIONAL_RECORDINGS_OPTIONS.map(
    (opt) => `${opt.recordings} recordings for $${opt.price}`
  ).join(' · ');

  const seatAddOns = ADDITIONAL_SEATS_OPTIONS.map((opt) => opt.label).join(' · ');

  // --- FAQ content ---

  const seen = new Map<string, string>();
  for (const item of [...FAQ_ITEMS, ...PRICING_FAQ_ITEMS]) {
    const key = item.question.toLowerCase().trim();
    const existing = seen.get(key);
    if (!existing || item.answer.length > existing.length) {
      seen.set(key, item.answer);
    }
  }

  const productFaq: { question: string; answer: string }[] = [];
  const pricingFaq: { question: string; answer: string }[] = [];
  const addedToProduct = new Set<string>();

  for (const item of FAQ_ITEMS) {
    const key = item.question.toLowerCase().trim();
    if (!addedToProduct.has(key)) {
      productFaq.push({ question: item.question, answer: seen.get(key)! });
      addedToProduct.add(key);
    }
  }

  for (const item of PRICING_FAQ_ITEMS) {
    const key = item.question.toLowerCase().trim();
    if (!addedToProduct.has(key)) {
      pricingFaq.push({ question: item.question, answer: seen.get(key)! });
    }
  }

  const formatFaqItems = (items: { question: string; answer: string }[]) =>
    items.map((item) => `**${item.question}**\n${item.answer}`).join('\n\n');

  return `# Userplane

> ${HERO_HEADING}

${HERO_DESCRIPTION}

No apps, no installs, no browser extensions. Just a simple link.

## How It Works

1. **Share a recording link** — Send your customer a one-click recording link. Works everywhere, no installs needed.
2. **Customer records the issue** — They click the link and record their screen showing exactly what went wrong.
3. **Get full context** — Receive the recording along with console errors, network activity, user steps, and error traces.
4. **Resolve faster** — No more back-and-forth. Get to the root cause faster by seeing the issue through your customer's lens.
5. **No more incomplete handoffs** — Pass complete context to engineers. Logs, repro steps, and recordings — all in one link. No incomplete handoffs.
6. **Privacy-first** — Recordings automatically redact confidential fields. Stay compliant and build confidence with your customers.

## Features

${featureSections}

---

# Pricing

> Simple, transparent pricing. Choose the plan that fits your team. No hidden fees, no surprises. Cancel anytime.

Save 20% with annual billing. Every paid plan includes a 14-day free trial.

| Plan | Price | Best For |
|------|-------|----------|
${planRows}

## Plans

${planSections}

## Feature Comparison

${comparisonSections}

## Add-Ons

- **Additional recordings**: ${recordingAddOns}
- **Additional seats**: ${seatAddOns}

---

# Frequently Asked Questions

## General

${formatFaqItems(productFaq)}

## Pricing & Billing

${formatFaqItems(pricingFaq)}

---

${formatLlmsLinks()}`;
}

export const GET: APIRoute = () => {
  return new Response(buildContent(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
