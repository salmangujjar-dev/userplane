# @userplane/pricing

## Purpose

`@userplane/pricing` is the shared source of truth for Userplane plan IDs, pricing display data, feature categories, feature gates, entitlement resource limits, billing cadence values, and pricing helper functions.

## Import Surface

- `@userplane/pricing`: plan ID constants and types, entitlement resource constants and helpers, plan display data, feature category and gate definitions, pricing plan builders, billing cadence values, fair-share helpers, and related types.

## Consumers

Package-level consumers include `@userplane/contract`, `@userplane/db`, and `@userplane/payments`.

## Quick Start

```ts
import {
  BASE_PRICING_PLANS,
  createPricingPlans,
  filterPlansByCycle,
  getEntitlementAction,
  getPlanName,
} from '@userplane/pricing';

const plans = createPricingPlans({
  ctaHref: '/signup',
  ctaLabel: 'Start free',
});

const monthly = filterPlansByCycle(plans, 'monthly');
const planName = getPlanName('starter_monthly');
const entitlement = getEntitlementAction(2, 1, 3);
```

## Architecture

- `src/index.ts` is the single package source file and intentionally keeps pricing constants close together.
- Plan IDs use underscore naming, such as `starter_monthly`, because downstream database and payment code depend on those values.
- `FREE_PLAN_ENTITLEMENTS` is hardcoded because the free plan has no Dodo product.
- Paid plan product IDs are owned by `@userplane/payments`; pricing owns plan identity, display data, feature gates, limits, and user-facing plan construction.

## Scripts

- `bun run build`: compile with `tsc`.
- `bun run dev`: compile in watch mode.
- `bun run typecheck`: run TypeScript without emitting output.
- `bun run lint`: run ESLint.

## Tests/Storybook

There is no package-local test or Storybook script. Use `typecheck`, `lint`, and consuming app checks for pricing UI or billing flows.

## Env/Secrets

No environment variables or secrets are required.

## Change Checklist

- Treat `PLAN_IDS`, `USER_SELECTABLE_PLAN_IDS`, and `RESOURCE_TYPE_VALUES` as cross-package contracts.
- Check `@userplane/payments`, `@userplane/db`, and `@userplane/contract` after plan ID or resource changes.
- Keep quoted limits and actual limits intentional; entitlement checks use actual limits.
- Verify pricing UI copy in consuming apps after changing display data.
- Run `bun run --filter @userplane/pricing typecheck` and `lint`.

## Troubleshooting

- If a plan ID is rejected downstream, confirm it exists in `PLAN_IDS`.
- If a paid product cannot be found, check product mapping in `@userplane/payments/products`.
- If entitlement behavior differs from marketing copy, compare `quotedLimit` and `actualLimit`.
- If billing cadence logic fails, verify the plan ID suffix and `BILLING_CADENCES`.
