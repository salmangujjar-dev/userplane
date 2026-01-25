/**
 * Product configuration mapping Userplane plans to DodoPayments products
 *
 * IMPORTANT: These product IDs must match the products created in your
 * DodoPayments dashboard. Update these values after creating products.
 */

import type { PlanId } from '@workspace/pricing';

import type { ProductConfig } from './types';

/**
 * Mapping of plan IDs to DodoPayments product IDs
 *
 * Product IDs should be updated with actual values from DodoPayments dashboard.
 * Format: pdt_xxxxxxxxxxxx
 *
 * SERVER-SIDE ONLY: This configuration should never be imported by client code.
 * Clients pass planId to API endpoints, which handle the conversion to product slugs internally.
 * Product mappings are kept server-side to avoid exposing configuration in client bundles.
 */
export const DODO_PRODUCT_IDS: Record<string, string> = {
  // Essential plans
  essential_monthly: process.env.DODO_PRODUCT_ESSENTIAL_MONTHLY || 'pdt_essential_monthly',
  essential_annual: process.env.DODO_PRODUCT_ESSENTIAL_ANNUAL || 'pdt_essential_annual',

  // Starter plans
  starter_monthly: process.env.DODO_PRODUCT_STARTER_MONTHLY || 'pdt_starter_monthly',
  starter_annual: process.env.DODO_PRODUCT_STARTER_ANNUAL || 'pdt_starter_annual',

  // Scale Up plans
  scale_up_monthly: process.env.DODO_PRODUCT_SCALE_UP_MONTHLY || 'pdt_scale_up_monthly',
  scale_up_annual: process.env.DODO_PRODUCT_SCALE_UP_ANNUAL || 'pdt_scale_up_annual',

  // Enterprise plans
  enterprise_monthly: process.env.DODO_PRODUCT_ENTERPRISE_MONTHLY || 'pdt_enterprise_monthly',
  enterprise_annual: process.env.DODO_PRODUCT_ENTERPRISE_ANNUAL || 'pdt_enterprise_annual',

  // Early Bird plans (legacy)
  early_bird_monthly: process.env.DODO_PRODUCT_EARLY_BIRD_MONTHLY || 'pdt_early_bird_monthly',
  early_bird_annual: process.env.DODO_PRODUCT_EARLY_BIRD_ANNUAL || 'pdt_early_bird_annual',
};

/**
 * Product configurations for checkout
 */
export const CHECKOUT_PRODUCTS: ProductConfig[] = [
  // Essential
  {
    productId: DODO_PRODUCT_IDS.essential_monthly!,
    slug: 'essential-monthly',
    planId: 'essential_monthly',
  },
  {
    productId: DODO_PRODUCT_IDS.essential_annual!,
    slug: 'essential-annual',
    planId: 'essential_annual',
  },

  // Starter
  {
    productId: DODO_PRODUCT_IDS.starter_monthly!,
    slug: 'starter-monthly',
    planId: 'starter_monthly',
  },
  {
    productId: DODO_PRODUCT_IDS.starter_annual!,
    slug: 'starter-annual',
    planId: 'starter_annual',
  },

  // Scale Up
  {
    productId: DODO_PRODUCT_IDS.scale_up_monthly!,
    slug: 'scale-up-monthly',
    planId: 'scale_up_monthly',
  },
  {
    productId: DODO_PRODUCT_IDS.scale_up_annual!,
    slug: 'scale-up-annual',
    planId: 'scale_up_annual',
  },

  // Enterprise
  {
    productId: DODO_PRODUCT_IDS.enterprise_monthly!,
    slug: 'enterprise-monthly',
    planId: 'enterprise_monthly',
  },
  {
    productId: DODO_PRODUCT_IDS.enterprise_annual!,
    slug: 'enterprise-annual',
    planId: 'enterprise_annual',
  },

  // Early Bird (legacy)
  {
    productId: DODO_PRODUCT_IDS.early_bird_monthly!,
    slug: 'early-bird-monthly',
    planId: 'early_bird_monthly',
  },
  {
    productId: DODO_PRODUCT_IDS.early_bird_annual!,
    slug: 'early-bird-annual',
    planId: 'early_bird_annual',
  },
];

/**
 * Get product config by plan ID
 */
export function getProductByPlanId(planId: PlanId): ProductConfig | undefined {
  return CHECKOUT_PRODUCTS.find((p) => p.planId === planId);
}

/**
 * Get product config by slug
 */
export function getProductBySlug(slug: string): ProductConfig | undefined {
  return CHECKOUT_PRODUCTS.find((p) => p.slug === slug);
}

/**
 * Get product config by DodoPayments product ID
 */
export function getProductByProductId(productId: string): ProductConfig | undefined {
  return CHECKOUT_PRODUCTS.find((p) => p.productId === productId);
}

/**
 * Get plan ID from DodoPayments product ID
 */
export function getPlanIdFromProductId(productId: string): PlanId | undefined {
  const product = getProductByProductId(productId);
  return product?.planId;
}

/**
 * Get checkout slug from plan ID
 */
export function getSlugFromPlanId(planId: PlanId): string | undefined {
  const product = getProductByPlanId(planId);
  return product?.slug;
}
