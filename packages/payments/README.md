# @userplane/payments

## Purpose

`@userplane/payments` contains the DodoPayments integration boundary for Userplane billing. It provides client construction, webhook helpers, product mapping, add-on helpers, subscription state transition validation, billing metadata helpers, and exported billing types.

## Import Surface

- `@userplane/payments`: client helpers, webhook helpers, add-on helpers, state-machine helpers, billing types, subscription status constants, proration constants, and DodoPayments error classes.
- `@userplane/payments/client`: DodoPayments client construction and singleton helpers.
- `@userplane/payments/types`: billing and DodoPayments type exports.
- `@userplane/payments/webhooks`: webhook parsing and mapping helpers.
- `@userplane/payments/products`: server-side product ID mappings and product lookup helpers.
- `@userplane/payments/metadata`: product metadata parsing/building helpers.
- `@userplane/payments/state-machine`: subscription transition validation helpers.

`products` reads product IDs from `process.env`, so keep it server-side.

## Consumers

Package-level consumers include `@userplane/auth`, `@userplane/contract`, and `@userplane/db`.

## Quick Start

```ts
import { createDodoPaymentsClient, processWebhookPayload } from '@userplane/payments';

const dodo = createDodoPaymentsClient({
  apiKey: process.env.DODO_API_KEY!,
  webhookSecret: process.env.DODO_WEBHOOK_SECRET!,
  environment: 'test_mode',
});

const processed = processWebhookPayload(webhookPayload);
```

Product lookup:

```ts
import { getProductByPlanId } from '@userplane/payments/products';

const product = getProductByPlanId('starter_monthly');
```

## Architecture

- `src/client.ts` wraps DodoPayments SDK construction and a package-local singleton.
- `src/types.ts` re-exports official DodoPayments types and defines Userplane billing types.
- `src/products.ts` maps Userplane plan IDs to DodoPayments product IDs and checkout slugs.
- `src/webhooks.ts` normalizes subscription webhook payload handling.
- `src/state-machine.ts` validates subscription status transitions.
- `src/addons.ts` maps seat add-ons to billing intervals.
- `src/metadata.ts` builds and parses flat product metadata.
- `scripts/plans/` contains plan metadata JSON inputs for product metadata seeding.

## Scripts

- `bun run build`: compile with `tsc`.
- `bun run dev`: compile in watch mode.
- `bun run lint`: run ESLint with zero warnings.
- `bun run lint:fix`: apply ESLint fixes.
- `bun run typecheck`: run TypeScript without emitting output.

## Tests/Storybook

There is no package-local test or Storybook script. Use `typecheck`, `lint`, and billing integration tests in consuming apps.

## Env/Secrets

Client construction expects callers to pass Dodo secrets:

- Dodo API key.
- Dodo webhook secret or webhook key.
- Dodo environment: `test_mode` or `live_mode`.

`src/products.ts` reads these optional product ID variables when imported:

- `DODO_PRODUCT_ESSENTIAL_MONTHLY`
- `DODO_PRODUCT_ESSENTIAL_ANNUAL`
- `DODO_PRODUCT_STARTER_MONTHLY`
- `DODO_PRODUCT_STARTER_ANNUAL`
- `DODO_PRODUCT_SCALE_UP_MONTHLY`
- `DODO_PRODUCT_SCALE_UP_ANNUAL`
- `DODO_PRODUCT_ENTERPRISE_MONTHLY`
- `DODO_PRODUCT_ENTERPRISE_ANNUAL`

## Change Checklist

- Keep `@userplane/pricing` plan IDs aligned with product mappings.
- Keep product metadata scripts and `scripts/plans/*.json` aligned with Dodo dashboard state.
- Do not import `@userplane/payments/products` from browser code.
- Verify webhook changes against Dodo event types and subscription status values.
- Run `bun run --filter @userplane/payments typecheck` and `lint`.

## Troubleshooting

- If a product resolves to a placeholder ID, check the relevant `DODO_PRODUCT_*` variable.
- If webhook signature validation fails in an app, verify the configured webhook secret/key passed to the client.
- If a plan change is rejected, check `state-machine` transition rules and Dodo error classes before adding special cases.
- If client code bundles secrets, search for imports from `@userplane/payments/products`.
