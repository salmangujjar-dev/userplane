/**
 * Shared pricing configuration for all apps
 * Provides consistent pricing plans, features, and options across the workspace
 */

// Types

/**
 * Plan identifiers - source of truth for database and pricing
 */
export const PLAN_IDS = [
  'starter_monthly',
  'starter_annual',
  'scale_up_monthly',
  'scale_up_annual',
  'enterprise_monthly',
  'enterprise_annual',
  'early_bird_monthly',
] as const;
export type PlanId = (typeof PLAN_IDS)[number];

/**
 * Billing cycle for plans
 */
export type PlanCycle = 'monthly' | 'annual' | 'one_time';

/**
 * Plan type
 */
export type PlanType = 'subscription' | 'custom' | 'one_time';

/**
 * Plan details containing billing information
 */
export interface PlanDetails {
  planType: PlanType;
  planRate: number | null;
  planCycle: PlanCycle;
}

/**
 * Plan feature with optional sub-features
 */
export interface PlanFeature {
  text: string;
  included?: boolean;
  subFeatures?: PlanFeature[];
}

/**
 * Base pricing plan structure (without CTA URLs)
 */
export interface BasePricingPlan {
  id: string;
  name: string;
  description: string;
  details: PlanDetails;
  features: PlanFeature[];
  isPopular?: boolean;
  isEnterprise?: boolean;
}

/**
 * Full pricing plan with CTA configuration
 */
export interface PricingPlan extends BasePricingPlan {
  ctaText: string;
  ctaUrl: string;
  ctaIsExternal?: boolean;
}

/**
 * Additional recordings option
 */
export interface RecordingsOption {
  recordings: number;
  price: number;
}

/**
 * Additional seats option
 */
export interface SeatsOption {
  users: number;
  price: number;
  label: string;
}

// Constants

/**
 * Pricing section title
 */
export const PRICING_TITLE = 'Pricing';

/**
 * Pricing section subtitle
 */
export const PRICING_SUBTITLE = 'Pricing that works for you';

/**
 * Additional recordings pricing options
 */
export const ADDITIONAL_RECORDINGS_OPTIONS: RecordingsOption[] = [
  { recordings: 50, price: 99 },
  { recordings: 100, price: 149 },
  { recordings: 250, price: 299 },
];

/**
 * Additional seats pricing options
 */
export const ADDITIONAL_SEATS_OPTIONS: SeatsOption[] = [
  { users: 5, price: 49, label: '$49 / 5 users' },
];

/**
 * Sales form URL for enterprise inquiries
 */
export const SALES_FORM_URL = 'https://tally.so/r/xXX7Er';

/**
 * Shared features for Starter plan
 */
const STARTER_FEATURES: PlanFeature[] = [
  {
    text: 'Unlimited recordings per month',
    included: true,
    subFeatures: [
      { text: 'Includes 30 minutes per month', included: true },
      { text: 'Request additional minutes', included: true },
    ],
  },
  {
    text: 'Upto 15 members per workspace',
    included: true,
    subFeatures: [
      { text: '5 seats included per month', included: true },
      { text: 'Request additional seats', included: true },
    ],
  },
  {
    text: 'Capture console & network logs',
    included: true,
    subFeatures: [
      { text: 'Capture browser logs', included: true },
      { text: 'Capture network activity', included: true },
      { text: 'Replay user actions', included: true },
      { text: 'Hide sensitive data', included: true },
      { text: 'Auto-blur sensitive fields', included: true },
    ],
  },
  {
    text: 'Customize Recording Links',
    included: false,
    subFeatures: [
      { text: 'Customize with your logo', included: false },
      { text: 'Customize sub-domain', included: false },
      { text: 'Remove userplane branding', included: false },
      { text: 'Custom data retention policy', included: false },
    ],
  },
  {
    text: 'Privacy & Compliance',
    included: true,
    subFeatures: [
      { text: 'Auto-blur sensitive data', included: true },
      { text: 'Enterprise-grade compliance', included: false },
      { text: 'Bring your own storage (BYOS)', included: false },
      { text: 'Data Residency Controls (US/EU)', included: false },
    ],
  },
];

/**
 * Shared features for Scaleup plan
 */
const SCALEUP_FEATURES: PlanFeature[] = [
  {
    text: 'Unlimited recordings per month',
    included: true,
    subFeatures: [
      { text: 'Includes 150 minutes per month', included: true },
      { text: 'Request additional minutes', included: true },
    ],
  },
  {
    text: 'Upto 45 members per workspace',
    included: true,
    subFeatures: [
      { text: '15 seats included per month', included: true },
      { text: 'Request additional seats', included: true },
    ],
  },
  {
    text: 'Capture console & network logs',
    included: true,
    subFeatures: [
      { text: 'Capture browser logs', included: true },
      { text: 'Capture network activity', included: true },
      { text: 'Replay user actions', included: true },
      { text: 'Hide sensitive data', included: true },
      { text: 'Auto-blur sensitive fields', included: true },
    ],
  },
  {
    text: 'Customize Recording Links',
    included: true,
    subFeatures: [
      { text: 'Customize with your logo', included: false },
      { text: 'Customize sub-domain', included: true },
      { text: 'Remove userplane branding', included: false },
      { text: 'Custom data retention policy', included: false },
    ],
  },
  {
    text: 'Privacy & Compliance',
    included: true,
    subFeatures: [
      { text: 'Auto-blur sensitive data', included: true },
      { text: 'Enterprise-grade compliance', included: false },
      { text: 'Bring your own storage (BYOS)', included: false },
      { text: 'Data Residency Controls (US/EU)', included: false },
    ],
  },
];

/**
 * Shared features for Early Bird plan
 */
const EARLY_BIRD_FEATURES: PlanFeature[] = [
  {
    text: 'Unlimited Screen Recordings',
    included: true,
    subFeatures: [
      {
        text: 'Get as many recordings as your team needs to understand and fix customer issues',
        included: true,
      },
    ],
  },
  {
    text: 'Capture Logs & Errors',
    included: true,
    subFeatures: [
      {
        text: 'Automatically capture error logs, network activity, and user steps with every recording',
        included: true,
      },
    ],
  },
];

/**
 * Shared features for Enterprise plan
 */
const ENTERPRISE_FEATURES: PlanFeature[] = [
  {
    text: 'Unlimited recordings per month',
    included: true,
    subFeatures: [
      { text: 'Upto 10 minutes per recording', included: true },
      { text: 'Unlimited minutes per month', included: true },
      { text: 'Request additional minutes', included: true },
    ],
  },
  {
    text: 'Unlimited members per workspace',
    included: true,
    subFeatures: [
      { text: 'Custom members per workspace', included: true },
      { text: 'Request additional seats', included: true },
    ],
  },
  {
    text: 'Capture console & network logs',
    included: true,
    subFeatures: [
      { text: 'Capture browser logs', included: true },
      { text: 'Capture network activity', included: true },
      { text: 'Replay user actions', included: true },
      { text: 'Hide sensitive data', included: true },
      { text: 'Auto-blur sensitive fields', included: true },
    ],
  },
  {
    text: 'Customize Recording Links',
    included: true,
    subFeatures: [
      { text: 'Customize with your logo', included: true },
      { text: 'Customize sub-domain', included: true },
      { text: 'Remove userplane branding', included: true },
      { text: 'Custom data retention policy', included: true },
    ],
  },
  {
    text: 'Privacy & Compliance',
    included: true,
    subFeatures: [
      { text: 'Auto-blur sensitive data', included: true },
      { text: 'Enterprise-grade compliance', included: true },
      { text: 'Bring your own storage (BYOS)', included: true },
      { text: 'Data Residency Controls (US/EU)', included: true },
    ],
  },
];

/**
 * All pricing plans flattened with separate monthly and annual entries
 */
export const BASE_PRICING_PLANS: BasePricingPlan[] = [
  // Starter Monthly
  {
    id: 'starter_monthly',
    name: 'Starter',
    description: 'For early stage startups starting out',
    details: {
      planType: 'subscription',
      planRate: 64,
      planCycle: 'monthly',
    },
    features: STARTER_FEATURES,
  },
  // Starter Annual
  {
    id: 'starter_annual',
    name: 'Starter',
    description: 'For early stage startups starting out',
    details: {
      planType: 'subscription',
      planRate: 49,
      planCycle: 'annual',
    },
    features: STARTER_FEATURES,
  },
  // Scale Up Monthly
  {
    id: 'scale_up_monthly',
    name: 'Scale Up',
    description: 'For scaleups looking to grow',
    details: {
      planType: 'subscription',
      planRate: 249,
      planCycle: 'monthly',
    },
    features: SCALEUP_FEATURES,
    isPopular: true,
  },
  // Scale Up Annual
  {
    id: 'scale_up_annual',
    name: 'Scale Up',
    description: 'For scaleups looking to grow',
    details: {
      planType: 'subscription',
      planRate: 199,
      planCycle: 'annual',
    },
    features: SCALEUP_FEATURES,
    isPopular: true,
  },
  // Enterprise Monthly
  {
    id: 'enterprise_monthly',
    name: 'Enterprise',
    description: 'For enterprises looking to scale',
    details: {
      planType: 'custom',
      planRate: null,
      planCycle: 'monthly',
    },
    features: ENTERPRISE_FEATURES,
    isEnterprise: true,
  },
  // Enterprise Annual
  {
    id: 'enterprise_annual',
    name: 'Enterprise',
    description: 'For enterprises looking to scale',
    details: {
      planType: 'custom',
      planRate: null,
      planCycle: 'annual',
    },
    features: ENTERPRISE_FEATURES,
    isEnterprise: true,
  },
  // Early Bird Monthly
  {
    id: 'early_bird_monthly',
    name: 'Early Bird',
    description: 'For early Userplane customers',
    details: {
      planType: 'subscription',
      planRate: 99,
      planCycle: 'monthly',
    },
    features: EARLY_BIRD_FEATURES,
  },
];

/**
 * Pricing version
 */
export type PricingVersion = 'v1' | 'v2';

/**
 * Mapping of pricing versions to plan IDs
 */
export const PRICING_VERSION_PLANS: Record<PricingVersion, PlanId[]> = {
  v1: [
    'starter_monthly',
    'starter_annual',
    'scale_up_monthly',
    'scale_up_annual',
    'enterprise_monthly',
    'enterprise_annual',
  ],
  v2: ['early_bird_monthly'],
};

/**
 * CTA configuration for pricing plans
 */
export interface PricingCtaConfig {
  signupUrl: string;
  salesFormUrl?: string;
  version?: PricingVersion;
}

/**
 * Create pricing plans with custom CTA URLs
 * Returns plans based on the specified version
 */
export function createPricingPlans(config: PricingCtaConfig): PricingPlan[] {
  const { signupUrl, salesFormUrl = SALES_FORM_URL, version = 'v1' } = config;

  const allowedPlanIds = PRICING_VERSION_PLANS[version];

  return BASE_PRICING_PLANS.filter((plan) => allowedPlanIds.includes(plan.id as PlanId)).map(
    (plan) => ({
      ...plan,
      ctaText: plan.isEnterprise ? 'Request Access' : 'Start Trial',
      ctaUrl: plan.isEnterprise ? salesFormUrl : signupUrl,
      ctaIsExternal: plan.isEnterprise,
    })
  );
}

/**
 * Filter plans by billing cycle
 */
export function filterPlansByCycle<T extends BasePricingPlan>(plans: T[], cycle: PlanCycle): T[] {
  return plans.filter((plan) => plan.details.planCycle === cycle);
}

/**
 * Format plan rate for display
 */
export function formatPlanRate(plan: BasePricingPlan): string {
  if (plan.details.planRate === null) {
    return 'Custom';
  }
  return `$${plan.details.planRate}`;
}
