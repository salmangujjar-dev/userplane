import {
  BASE_PRICING_PLANS,
  filterPlansByCycle,
  formatPlanRate,
  PLAN_CARD_HIGHLIGHTS,
} from '@userplane/pricing';
import type { APIRoute } from 'astro';

import { FEATURES } from '@/constants/home/features';
import { HERO_DESCRIPTION, HERO_HEADING } from '@/constants/home/hero';
import { formatLlmsLinks } from '@/constants/llms/llms';

function buildContent(): string {
  const monthlyPlans = filterPlansByCycle(BASE_PRICING_PLANS, 'monthly');
  const annualPlans = filterPlansByCycle(BASE_PRICING_PLANS, 'annual');

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

  const featureSections = FEATURES.map(
    (feature) => `### ${feature.title}\n${feature.description}`
  ).join('\n\n');

  const planDetails = monthlyPlans
    .map((plan) => {
      const highlights = PLAN_CARD_HIGHLIGHTS[plan.name];
      if (!highlights) return '';
      const items = highlights.map((h) => `- ${h}`).join('\n');
      return `**${plan.name}** — ${plan.description}\n${items}`;
    })
    .filter(Boolean)
    .join('\n\n');

  return `# Userplane

> ${HERO_HEADING}

${HERO_DESCRIPTION}

No apps, no installs, no browser extensions. Just a simple link.

## How It Works

1. **Share a recording link** — Send your customer a one-click recording link. Works everywhere, no installs needed.
2. **Customer records the issue** — They click the link and record their screen showing exactly what went wrong.
3. **Get full context** — Receive the recording along with console errors, network activity, user steps, and error traces.
4. **Resolve faster** — No more back-and-forth. See the issue through your customer's eyes and fix it.

## Features

${featureSections}

## Pricing

Simple, transparent pricing. No hidden fees, no surprises. Cancel anytime. Save 20% with annual billing.

| Plan | Price | Best For |
|------|-------|----------|
${planRows}

${planDetails}

Full pricing breakdown and feature comparison available at [userplane.io/pricing.md](https://userplane.io/pricing.md).

Every paid plan includes a 14-day free trial. See all [frequently asked questions](https://userplane.io/faq.md).

---

${formatLlmsLinks(['Home'])}`;
}

export const GET: APIRoute = () => {
  return new Response(buildContent(), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
