/**
 * Shared pricing configuration for all apps
 * Provides consistent pricing plans, features, and options across the workspace
 */

// Types

/**
 * Plan identifiers - source of truth for database and pricing
 */
export const PLAN_IDS = [
  'essential_monthly',
  'essential_annual',
  'starter_monthly',
  'starter_annual',
  'scale_up_monthly',
  'scale_up_annual',
  'free',
  'enterprise_monthly',
  'enterprise_annual',
  'custom',
] as const;
export type PlanId = (typeof PLAN_IDS)[number];

/**
 * User-selectable plan identifiers (excludes free plan)
 * Used for workspace creation forms and user-facing plan selection
 */
export const USER_SELECTABLE_PLAN_IDS = [
  'essential_monthly',
  'essential_annual',
  'starter_monthly',
  'starter_annual',
  'scale_up_monthly',
  'scale_up_annual',
  'enterprise_monthly',
  'enterprise_annual',
] as const;
export type UserSelectablePlanId = (typeof USER_SELECTABLE_PLAN_IDS)[number];

/**
 * Resource types for entitlements
 */
export const RESOURCE_TYPE_VALUES = [
  'seats',
  'links',
  'recordings',
  'screenshots',
  'files',
] as const;
export type ResourceType = (typeof RESOURCE_TYPE_VALUES)[number];

/**
 * Lifetime resources - accumulate over the subscription lifetime and are NOT reset on renewal
 * Examples: team members (seats)
 */
export const LIFETIME_RESOURCES: readonly ResourceType[] = ['seats'] as const;

/**
 * Period-based resources - measured per billing cycle and reset to 0 on subscription renewal
 * Examples: recordings per month, links per month, screenshots per month, files per month
 */
export const PERIOD_BASED_RESOURCES: readonly ResourceType[] = [
  'recordings',
  'links',
  'screenshots',
  'files',
] as const;

/**
 * Resource limit configuration for a plan
 */
export interface ResourceLimits {
  // The advertised limit (what customers see, not used for entitlement checks)
  quotedLimit: number;
  // Used for entitlement checks and customer warnings - when current usage >= softLimit, a warning is triggered
  softLimit: number;
  // Used for entitlement checks and customer warnings - when current usage >= hardLimit, consumption is blocked
  hardLimit: number;
}

/**
 * Entitlement configuration for a plan
 */
export type PlanEntitlements = Record<ResourceType, ResourceLimits>;

/**
 * Unlimited quoted limit value
 */
export const UNLIMITED_QUOTED_LIMIT = -1;

/**
 * Entitlement action values
 */
export type EntitlementAction = 'allow' | 'warn' | 'block';

/**
 * Free plan entitlements - hardcoded since free plan has no Dodo product
 * All paid plan entitlements come from Dodo product metadata
 */
export const FREE_PLAN_ENTITLEMENTS: PlanEntitlements = {
  seats: {
    quotedLimit: 3,
    softLimit: 3,
    hardLimit: 3,
  },
  recordings: {
    quotedLimit: 3,
    softLimit: 3,
    hardLimit: 3,
  },
  links: {
    quotedLimit: 3,
    softLimit: 6,
    hardLimit: 8,
  },
  screenshots: {
    quotedLimit: 0,
    softLimit: 0,
    hardLimit: 0,
  },
  files: {
    quotedLimit: 0,
    softLimit: 0,
    hardLimit: 0,
  },
};

/**
 * Helper to get entitlement action based on actual limits
 *
 * @param currentUsage - The current usage of the resource
 * @param requestedConsumptionUnits - The number of units to consume
 * @param hardLimit - The hard limit for the resource
 * @param softLimit - The soft limit for the resource
 * @returns The entitlement action
 */
export function getEntitlementAction(
  currentUsage: number,
  requestedConsumptionUnits: number,
  hardLimit: number,
  softLimit: number
): { entitlementAction: EntitlementAction; resourceConsumed: number } {
  // If the current usage + consumption units exceeds the hard limit, block the request
  if (currentUsage + requestedConsumptionUnits > hardLimit) {
    return { entitlementAction: 'block', resourceConsumed: currentUsage };
  }

  // If the current usage + consumption units exceeds the soft limit, warn the user
  if (currentUsage + requestedConsumptionUnits > softLimit) {
    return {
      entitlementAction: 'warn',
      resourceConsumed: currentUsage + requestedConsumptionUnits,
    };
  }

  // Within limits, allow the request
  return {
    entitlementAction: 'allow',
    resourceConsumed: currentUsage + requestedConsumptionUnits,
  };
}

/**
 * Unique plan name values for type safety
 */
export const PLAN_NAME_VALUES = [
  'Essential',
  'Starter',
  'Scale Up',
  'Free',
  'Enterprise',
  'Custom',
] as const;
export type PlanName = (typeof PLAN_NAME_VALUES)[number];

/**
 * User-friendly plan names - source of truth for display names
 */
export const PLAN_NAMES: Record<PlanId, PlanName> = {
  essential_monthly: 'Essential',
  essential_annual: 'Essential',
  starter_monthly: 'Starter',
  starter_annual: 'Starter',
  scale_up_monthly: 'Scale Up',
  scale_up_annual: 'Scale Up',
  free: 'Free',
  enterprise_monthly: 'Enterprise',
  enterprise_annual: 'Enterprise',
  custom: 'Custom',
};

/**
 * Default plan name for fallback
 */
export const DEFAULT_PLAN_NAME: PlanName = 'Free';

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
 * Plan feature with optional sub-features (legacy format for homepage)
 */
export interface PlanFeatureHighlight {
  text: string;
  included?: boolean;
  subFeatures?: PlanFeatureHighlight[];
}

// ============================================================================
// Category-based Feature System
// ============================================================================

/**
 * Feature categories for pricing comparison
 */
export const FEATURE_CATEGORIES = [
  'workspace',
  'screenRecordings',
  'screenshots',
  'files',
  'logsDebugging',
  'customization',
  'privacyCompliance',
  'integrations',
  'support',
] as const;
export type FeatureCategory = (typeof FEATURE_CATEGORIES)[number];

/**
 * Human-readable category labels
 */
export const FEATURE_CATEGORY_LABELS: Record<FeatureCategory, string> = {
  workspace: 'Workspace',
  screenRecordings: 'Screen Recordings',
  screenshots: 'Screenshots',
  files: 'Files',
  logsDebugging: 'Logs & Debugging',
  customization: 'Customization',
  privacyCompliance: 'Privacy & Compliance',
  integrations: 'Integrations',
  support: 'Support',
};

/**
 * Feature value can be boolean (included/not), string (limit text), or number
 */
export type FeatureValue = boolean | string | number;

/**
 * Single feature item within a category
 */
export interface CategoryFeatureItem {
  name: string;
  key: string;
  tooltip?: string;
}

/**
 * Feature values for a specific plan within a category
 */
export type PlanCategoryFeatures = Record<string, FeatureValue>;

/**
 * All category features for a plan
 */
export type PlanAllCategoryFeatures = Record<FeatureCategory, PlanCategoryFeatures>;

/**
 * Feature definitions for each category
 */
export const CATEGORY_FEATURE_DEFINITIONS: Record<FeatureCategory, CategoryFeatureItem[]> = {
  workspace: [
    { name: 'Seats included', key: 'seatsIncluded' },
    { name: 'Maximum seats', key: 'maxSeats' },
    { name: 'Request additional seats', key: 'additionalSeats' },
  ],
  screenRecordings: [
    { name: 'Recording links', key: 'recordingLinks' },
    { name: 'Recordings per month', key: 'recordingsPerMonth' },
    { name: 'Request sessions', key: 'requestSessions' },
    { name: 'Replay recordings', key: 'replayRecordings' },
    { name: 'Auto-blur sensitive data', key: 'autoBlur' },
    { name: 'Bring your own storage (BYOS)', key: 'byos' },
  ],
  screenshots: [
    { name: 'Screenshots', key: 'screenshots' },
    { name: 'Screenshot annotation', key: 'screenshotAnnotation' },
    { name: 'Bring your own storage (BYOS)', key: 'byos' },
  ],
  files: [
    { name: 'File uploads', key: 'fileUploads' },
    { name: 'Max per file size', key: 'maxFileSize' },
    { name: 'Bring your own storage (BYOS)', key: 'byos' },
  ],
  logsDebugging: [
    { name: 'Console logs', key: 'consoleLogs' },
    { name: 'Network activity', key: 'networkActivity' },
    { name: 'Server-side logs', key: 'serverLogs' },
    { name: 'User action replay', key: 'actionReplay' },
  ],
  customization: [
    { name: 'Custom logo', key: 'customLogo' },
    { name: 'Remove Userplane branding', key: 'removeBranding' },
  ],
  privacyCompliance: [
    { name: 'Auto-blur sensitive data', key: 'autoBlurPrivacy' },
    { name: 'Enterprise-grade compliance', key: 'enterpriseCompliance' },
    { name: 'Custom data retention', key: 'customRetention' },
    { name: 'Data residency (US/EU)', key: 'dataResidency' },
  ],
  integrations: [
    { name: 'Helpdesks (Intercom, Zendesk)', key: 'helpdesks' },
    { name: 'CRMs (Salesforce, HubSpot)', key: 'crms' },
    { name: 'Issue trackers (Jira, Linear)', key: 'issueTrackers' },
    { name: 'Automation (Zapier, n8n)', key: 'automation' },
    { name: 'API access', key: 'apiAccess' },
  ],
  support: [
    { name: 'Email support', key: 'emailSupport' },
    { name: 'Priority support', key: 'prioritySupport' },
    { name: 'Dedicated support', key: 'dedicatedSupport' },
  ],
};

/**
 * Category features for Essential plan
 */
const ESSENTIAL_CATEGORY_FEATURES: PlanAllCategoryFeatures = {
  workspace: {
    seatsIncluded: 'Up to 5',
    maxSeats: 'Up to 15',
    additionalSeats: true,
  },
  screenRecordings: {
    recordingLinks: 'Unlimited',
    recordingsPerMonth: '25',
    requestSessions: false,
    replayRecordings: true,
    autoBlur: true,
    byos: false,
  },
  screenshots: {
    screenshots: false,
    screenshotAnnotation: false,
    byos: false,
  },
  files: {
    fileUploads: false,
    maxFileSize: '-',
    byos: false,
  },
  logsDebugging: {
    consoleLogs: false,
    networkActivity: false,
    serverLogs: false,
    actionReplay: false,
  },
  customization: {
    customLogo: false,
    removeBranding: false,
  },
  privacyCompliance: {
    autoBlurPrivacy: true,
    enterpriseCompliance: true,
    customRetention: true,
    dataResidency: false,
  },
  integrations: {
    helpdesks: true,
    crms: false,
    issueTrackers: false,
    automation: false,
    apiAccess: false,
  },
  support: {
    emailSupport: true,
    prioritySupport: false,
    dedicatedSupport: false,
  },
};

/**
 * Feature highlights for Essential plan
 */
const ESSENTIAL_FEATURE_HIGHLIGHTS: PlanFeatureHighlight[] = [
  {
    text: 'Request Screen Recordings',
    included: true,
    subFeatures: [
      {
        text: 'Request recordings for any customer issue',
        included: true,
      },
    ],
  },
  {
    text: 'Replay Customer Issues',
    included: true,
    subFeatures: [
      {
        text: 'Know exactly what went wrong, without the back and forth',
        included: true,
      },
    ],
  },
  {
    text: 'Redact Sensitive Customer Data',
    included: true,
    subFeatures: [
      {
        text: 'Mask confidential fields and sensitive data from customer recordings',
        included: true,
      },
    ],
  },
];

/**
 * Category features for Starter plan
 */
const STARTER_CATEGORY_FEATURES: PlanAllCategoryFeatures = {
  workspace: {
    seatsIncluded: 'Up to 10',
    maxSeats: 'Up to 20',
    additionalSeats: true,
  },
  screenRecordings: {
    recordingLinks: 'Unlimited',
    recordingsPerMonth: 'Unlimited',
    requestSessions: true,
    replayRecordings: true,
    autoBlur: true,
    byos: false,
  },
  screenshots: {
    screenshots: false,
    screenshotAnnotation: false,
    byos: false,
  },
  files: {
    fileUploads: false,
    maxFileSize: '-',
    byos: false,
  },
  logsDebugging: {
    consoleLogs: false,
    networkActivity: false,
    serverLogs: false,
    actionReplay: false,
  },
  customization: {
    customLogo: true,
    removeBranding: true,
  },
  privacyCompliance: {
    autoBlurPrivacy: true,
    enterpriseCompliance: true,
    customRetention: true,
    dataResidency: false,
  },
  integrations: {
    helpdesks: true,
    crms: false,
    issueTrackers: false,
    automation: false,
    apiAccess: false,
  },
  support: {
    emailSupport: true,
    prioritySupport: false,
    dedicatedSupport: false,
  },
};

/**
 * Feature highlights for Starter plan
 */
const STARTER_FEATURE_HIGHLIGHTS: PlanFeatureHighlight[] = [
  {
    text: 'Request Unlimited Screen Recordings',
    included: true,
    subFeatures: [
      {
        text: 'Request unlimited recordings for any customer issue',
        included: true,
      },
    ],
  },
  {
    text: 'Replay Customer Issues',
    included: true,
    subFeatures: [
      {
        text: 'Know exactly what went wrong, without the back and forth',
        included: true,
      },
    ],
  },
  {
    text: 'Redact Sensitive Customer Data',
    included: true,
    subFeatures: [
      {
        text: 'Mask confidential fields and sensitive data from customer recordings',
        included: true,
      },
    ],
  },
];

/**
 * Category features for Scale Up plan
 */
const SCALE_UP_CATEGORY_FEATURES: PlanAllCategoryFeatures = {
  workspace: {
    seatsIncluded: 'Up to 15',
    maxSeats: 'Up to 30',
    additionalSeats: true,
  },
  screenRecordings: {
    recordingLinks: 'Unlimited',
    recordingsPerMonth: 'Unlimited',
    requestSessions: true,
    replayRecordings: true,
    autoBlur: true,
    byos: false,
  },
  screenshots: {
    screenshots: false,
    screenshotAnnotation: false,
    byos: false,
  },
  files: {
    fileUploads: false,
    maxFileSize: '-',
    byos: false,
  },
  logsDebugging: {
    consoleLogs: false,
    networkActivity: false,
    serverLogs: false,
    actionReplay: false,
  },
  customization: {
    customLogo: true,
    removeBranding: true,
  },
  privacyCompliance: {
    autoBlurPrivacy: true,
    enterpriseCompliance: true,
    customRetention: true,
    dataResidency: false,
  },
  integrations: {
    helpdesks: true,
    crms: true,
    issueTrackers: true,
    automation: true,
    apiAccess: false,
  },
  support: {
    emailSupport: true,
    prioritySupport: true,
    dedicatedSupport: false,
  },
};

/**
 * Feature highlights for Scale Up plan
 */
const SCALE_UP_FEATURE_HIGHLIGHTS: PlanFeatureHighlight[] = [
  {
    text: 'Request Unlimited Screen Recordings',
    included: true,
    subFeatures: [
      {
        text: 'Request unlimited recordings for any customer issue',
        included: true,
      },
    ],
  },
  {
    text: 'Replay Customer Issues',
    included: true,
    subFeatures: [
      {
        text: 'Know exactly what went wrong, without the back and forth',
        included: true,
      },
    ],
  },
  {
    text: 'Redact Sensitive Customer Data',
    included: true,
    subFeatures: [
      {
        text: 'Mask confidential fields and sensitive data from customer recordings',
        included: true,
      },
    ],
  },
];

/**
 * Category features for Enterprise plan
 */
const ENTERPRISE_CATEGORY_FEATURES: PlanAllCategoryFeatures = {
  workspace: {
    seatsIncluded: 'Up to 30',
    maxSeats: 'Up to 45',
    additionalSeats: true,
  },
  screenRecordings: {
    recordingLinks: 'Unlimited',
    recordingsPerMonth: 'Unlimited',
    requestSessions: true,
    replayRecordings: true,
    autoBlur: true,
    byos: true,
  },
  screenshots: {
    screenshots: 'Unlimited',
    screenshotAnnotation: true,
    byos: true,
  },
  files: {
    fileUploads: true,
    maxFileSize: '100 GB',
    byos: true,
  },
  logsDebugging: {
    consoleLogs: true,
    networkActivity: true,
    serverLogs: true,
    actionReplay: true,
  },
  customization: {
    customLogo: true,
    removeBranding: true,
  },
  privacyCompliance: {
    autoBlurPrivacy: true,
    enterpriseCompliance: true,
    customRetention: true,
    dataResidency: true,
  },
  integrations: {
    helpdesks: true,
    crms: true,
    issueTrackers: true,
    automation: true,
    apiAccess: true,
  },
  support: {
    emailSupport: true,
    prioritySupport: true,
    dedicatedSupport: true,
  },
};

/**
 * Feature highlights for Enterprise plan
 */
const ENTERPRISE_FEATURE_HIGHLIGHTS: PlanFeatureHighlight[] = [
  {
    text: 'Request Unlimited Screen Recordings & Screenshots',
    included: true,
    subFeatures: [
      {
        text: 'Request unlimited recordings and screenshots for any customer issue',
        included: true,
      },
    ],
  },
  {
    text: 'Console & server logs debugging',
    included: true,
    subFeatures: [
      {
        text: 'Debug customer issues with console & server logs',
        included: true,
      },
    ],
  },
  {
    text: 'Replay Customer Issues',
    included: true,
    subFeatures: [
      {
        text: 'Know exactly what went wrong, without the back and forth',
        included: true,
      },
    ],
  },
  {
    text: 'Redact Sensitive Customer Data',
    included: true,
    subFeatures: [
      {
        text: 'Mask confidential fields and sensitive data from customer recordings',
        included: true,
      },
    ],
  },
  {
    text: 'Bring your own storage (BYOS)',
    included: true,
    subFeatures: [
      {
        text: 'Bring your own storage for recordings, screenshots & files',
        included: true,
      },
    ],
  },
];

/**
 * Category features by plan name
 */
export const PLAN_CATEGORY_FEATURES: Record<string, PlanAllCategoryFeatures> = {
  Essential: ESSENTIAL_CATEGORY_FEATURES,
  Starter: STARTER_CATEGORY_FEATURES,
  'Scale Up': SCALE_UP_CATEGORY_FEATURES,
  Enterprise: ENTERPRISE_CATEGORY_FEATURES,
};

/**
 * Get category features for a plan
 */
export function getPlanCategoryFeatures(planName: string): PlanAllCategoryFeatures | undefined {
  return PLAN_CATEGORY_FEATURES[planName];
}

/**
 * Plan card highlights (short feature list for cards)
 */
export const PLAN_CARD_HIGHLIGHTS: Record<string, string[]> = {
  Essential: [
    'Up to 15 seats in workspace',
    'Up to 25 recordings per month',
    'Unlimited recording links',
    'Helpdesk integrations',
  ],
  Starter: [
    'Everything in Essential',
    'Up to 20 seats in workspace',
    'Request unlimited recordings',
    'Unlimited recording links',
    'Customize Userplane workspace branding',
    'Custom data retention policies',
  ],
  'Scale Up': [
    'Everything in Starter',
    'Up to 30 seats in workspace',
    'Request unlimited recordings',
    'Customize Userplane workspace branding',
    'Custom data retention policies',
    'Priority support',
    'Additional integrations (CRM, issue trackers)',
  ],
  Enterprise: [
    'Everything in Scale Up',
    'Unlimited seats in workspace',
    'Request unlimited recordings',
    'Bring your own storage (BYOS) for recordings, screenshots & files',
    'Console & server logs debugging',
    'API access',
    'Data residency (US/EU)',
    'Dedicated support',
  ],
};

// ============================================================================
// Base Pricing Plans
// ============================================================================

/**
 * Base pricing plan structure (without CTA URLs)
 */
export interface BasePricingPlan {
  id: string;
  name: string;
  description: string;
  details: PlanDetails;
  // Feature highlights for the plan for the homepage
  featureHighlights: PlanFeatureHighlight[];
  // Category features for the plan for the pricing column
  categoryFeatures?: PlanAllCategoryFeatures;
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
 * All pricing plans with monthly and annual variants
 */
export const BASE_PRICING_PLANS: BasePricingPlan[] = [
  // Essential Monthly
  {
    id: 'essential_monthly',
    name: 'Essential',
    description: 'For small teams getting started',
    details: {
      planType: 'subscription',
      planRate: 59,
      planCycle: 'monthly',
    },
    featureHighlights: ESSENTIAL_FEATURE_HIGHLIGHTS,
    categoryFeatures: ESSENTIAL_CATEGORY_FEATURES,
  },
  // Essential Annual
  {
    id: 'essential_annual',
    name: 'Essential',
    description: 'For small teams getting started',
    details: {
      planType: 'subscription',
      planRate: 47,
      planCycle: 'annual',
    },
    featureHighlights: ESSENTIAL_FEATURE_HIGHLIGHTS,
    categoryFeatures: ESSENTIAL_CATEGORY_FEATURES,
  },
  // Starter Monthly
  {
    id: 'starter_monthly',
    name: 'Starter',
    description: 'For growing teams',
    details: {
      planType: 'subscription',
      planRate: 99,
      planCycle: 'monthly',
    },
    featureHighlights: STARTER_FEATURE_HIGHLIGHTS,
    categoryFeatures: STARTER_CATEGORY_FEATURES,
  },
  // Starter Annual
  {
    id: 'starter_annual',
    name: 'Starter',
    description: 'For growing teams',
    details: {
      planType: 'subscription',
      planRate: 79,
      planCycle: 'annual',
    },
    featureHighlights: STARTER_FEATURE_HIGHLIGHTS,
    categoryFeatures: STARTER_CATEGORY_FEATURES,
  },
  // Scale Up Monthly
  {
    id: 'scale_up_monthly',
    name: 'Scale Up',
    description: 'For scaling teams',
    details: {
      planType: 'subscription',
      planRate: 249,
      planCycle: 'monthly',
    },
    featureHighlights: SCALE_UP_FEATURE_HIGHLIGHTS,
    categoryFeatures: SCALE_UP_CATEGORY_FEATURES,
    isPopular: true,
  },
  // Scale Up Annual
  {
    id: 'scale_up_annual',
    name: 'Scale Up',
    description: 'For scaling teams',
    details: {
      planType: 'subscription',
      planRate: 199,
      planCycle: 'annual',
    },
    featureHighlights: SCALE_UP_FEATURE_HIGHLIGHTS,
    categoryFeatures: SCALE_UP_CATEGORY_FEATURES,
    isPopular: true,
  },
  // Enterprise Monthly
  {
    id: 'enterprise_monthly',
    name: 'Enterprise',
    description: 'For large teams and organizations',
    details: {
      planType: 'custom',
      planRate: null,
      planCycle: 'monthly',
    },
    featureHighlights: [],
    categoryFeatures: ENTERPRISE_CATEGORY_FEATURES,
    isEnterprise: true,
  },
  // Enterprise Annual
  {
    id: 'enterprise_annual',
    name: 'Enterprise',
    description: 'For large teams and organizations',
    details: {
      planType: 'custom',
      planRate: null,
      planCycle: 'annual',
    },
    featureHighlights: ENTERPRISE_FEATURE_HIGHLIGHTS,
    categoryFeatures: ENTERPRISE_CATEGORY_FEATURES,
    isEnterprise: true,
  },
  // Free
  {
    id: 'free',
    name: 'Free',
    description: 'Try Userplane for free',
    details: {
      planType: 'one_time',
      planRate: 0,
      planCycle: 'one_time',
    },
    featureHighlights: ENTERPRISE_FEATURE_HIGHLIGHTS,
  },
];

/**
 * CTA configuration for pricing plans
 */
export interface PricingCtaConfig {
  signupUrl: string;
  salesFormUrl?: string;
}

/**
 * Create pricing plans with custom CTA URLs
 */
export function createPricingPlans(config: PricingCtaConfig): PricingPlan[] {
  const { signupUrl, salesFormUrl = SALES_FORM_URL } = config;

  return BASE_PRICING_PLANS.map((plan) => ({
    ...plan,
    ctaText: plan.isEnterprise ? 'Request Access' : 'Start Trial',
    ctaUrl: plan.isEnterprise ? salesFormUrl : signupUrl,
    ctaIsExternal: plan.isEnterprise,
  }));
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

/**
 * Get user-friendly plan name from plan ID
 * @param planId - The plan identifier
 * @returns User-friendly plan name
 */
export function getPlanName(planId: PlanId): PlanName {
  return PLAN_NAMES[planId] as PlanName;
}

// ============================================================================
// Feature Gates
// ============================================================================

/**
 * Feature gate keys - boolean flags for whether a feature is accessible on a plan
 * Unlike resource limits (entitlements), these are on/off toggles per plan.
 * Billing cycle (monthly/annual) does not affect feature access.
 */
export const FEATURE_GATE_KEYS = [
  // Screen recordings
  'replayRecordings',
  'autoBlurSensitiveData',
  'requestSessions',
  // Screenshots
  'requestScreenshots',
  'annotateScreenshots',
  // Files
  'requestFileUploads',
  // Logs and debugging
  'requestConsoleLogs',
  'requestNetworkActivity',
  'requestServerLogs',
  'requestActionReplay',
  // Customization
  'customizeWorkspace',
  // Workspace
  'requestAdditionalSeats',
  // Bring your own storage
  'bringYourOwnStorageRecordings',
  'bringYourOwnStorageScreenshots',
  'bringYourOwnStorageFiles',
  // Privacy and compliance
  'customizeDataRetention',
  'enableEnterpriseCompliance',
  'customizeDataResidency',
  // Integrations
  'integrateHelpDesks',
  'integrateCRMs',
  'integrateIssueTrackers',
  'integrateAutomation',
  'accessUserplaneAPI',
] as const;

export type FeatureGate = (typeof FEATURE_GATE_KEYS)[number];

/**
 * Human-readable labels for feature gates
 */
export const FEATURE_GATE_LABELS: Record<FeatureGate, string> = {
  replayRecordings: 'Replay Recordings',
  autoBlurSensitiveData: 'Auto-blur Sensitive Data',
  requestSessions: 'Request Sessions',
  requestScreenshots: 'Request Screenshots',
  annotateScreenshots: 'Annotate Screenshots',
  requestFileUploads: 'Request File Uploads',
  requestConsoleLogs: 'Request Console Logs',
  requestNetworkActivity: 'Request Network Activity',
  requestServerLogs: 'Request Server Logs',
  requestActionReplay: 'Request Action Replay',
  customizeWorkspace: 'Customize Workspace',
  requestAdditionalSeats: 'Request Additional Seats',
  bringYourOwnStorageRecordings: 'BYOS Recordings',
  bringYourOwnStorageScreenshots: 'BYOS Screenshots',
  bringYourOwnStorageFiles: 'BYOS Files',
  customizeDataRetention: 'Custom Data Retention',
  enableEnterpriseCompliance: 'Enterprise Compliance',
  customizeDataResidency: 'Custom Data Residency',
  integrateHelpDesks: 'Helpdesk Integrations',
  integrateCRMs: 'CRM Integrations',
  integrateIssueTrackers: 'Issue Tracker Integrations',
  integrateAutomation: 'Automation Integrations',
  accessUserplaneAPI: 'API Access',
};

/**
 * Feature gates for a plan - each gate is a boolean flag
 */
export type PlanFeatureGates = Record<FeatureGate, boolean>;

/**
 * Free plan feature gates - hardcoded since free plan has no Dodo product
 * All paid plan feature gates come from Dodo product metadata (stored on subscription record)
 */
export const FREE_PLAN_FEATURE_GATES: PlanFeatureGates = {
  replayRecordings: true,
  autoBlurSensitiveData: true,
  requestSessions: false,
  requestScreenshots: false,
  annotateScreenshots: false,
  requestFileUploads: false,
  requestConsoleLogs: false,
  requestNetworkActivity: false,
  requestServerLogs: false,
  requestActionReplay: false,
  customizeWorkspace: false,
  requestAdditionalSeats: false,
  bringYourOwnStorageRecordings: false,
  bringYourOwnStorageScreenshots: false,
  bringYourOwnStorageFiles: false,
  customizeDataRetention: false,
  enableEnterpriseCompliance: false,
  customizeDataResidency: false,
  integrateHelpDesks: false,
  integrateCRMs: false,
  integrateIssueTrackers: false,
  integrateAutomation: false,
  accessUserplaneAPI: false,
};

// ============================================================================
// Abuse Prevention Configuration
// ============================================================================

/**
 * Abuse prevention configuration
 */
export const ABUSE_PREVENTION = {
  workspaceCreation: {
    maxPerYear: 3,
    adminMaxPerYear: 90,
    lookbackDays: 365,
  },
} as const;

/**
 * Cooldown schedule step
 */
export interface CooldownStep {
  days: number;
  multiplier: number;
}

/**
 * Cooldown configuration structure
 */
export interface CooldownConfig {
  durationDays: number;
  schedule: CooldownStep[];
}

/**
 * Cooldown configuration by plan ID
 * Controls progressive entitlement unlock for new subscriptions
 * Falls back to 'default' config if plan ID is not found
 */
export const COOLDOWN_CONFIG: Record<PlanId | 'default', CooldownConfig> = {
  // Essential plans - 30 day ramp
  essential_monthly: {
    durationDays: 30,
    schedule: [
      { days: 0, multiplier: 0.25 }, // Week 1: 25%
      { days: 7, multiplier: 0.5 }, // Week 2: 50%
      { days: 14, multiplier: 0.75 }, // Week 3: 75%
      { days: 21, multiplier: 1.0 }, // Week 4+: 100%
    ],
  },
  essential_annual: {
    durationDays: 30,
    schedule: [
      { days: 0, multiplier: 0.25 }, // Week 1: 25%
      { days: 7, multiplier: 0.5 }, // Week 2: 50%
      { days: 14, multiplier: 0.75 }, // Week 3: 75%
      { days: 21, multiplier: 1.0 }, // Week 4+: 100%
    ],
  },

  // Starter plans - 30 day ramp
  starter_monthly: {
    durationDays: 30,
    schedule: [
      { days: 0, multiplier: 0.25 }, // Week 1: 25%
      { days: 7, multiplier: 0.5 }, // Week 2: 50%
      { days: 14, multiplier: 0.75 }, // Week 3: 75%
      { days: 21, multiplier: 1.0 }, // Week 4+: 100%
    ],
  },
  starter_annual: {
    durationDays: 30,
    schedule: [
      { days: 0, multiplier: 0.25 }, // Week 1: 25%
      { days: 7, multiplier: 0.5 }, // Week 2: 50%
      { days: 14, multiplier: 0.75 }, // Week 3: 75%
      { days: 21, multiplier: 1.0 }, // Week 4+: 100%
    ],
  },

  // Scale Up plans - 14 day faster ramp
  scale_up_monthly: {
    durationDays: 14,
    schedule: [
      { days: 0, multiplier: 0.5 }, // Week 1: 50%
      { days: 7, multiplier: 1.0 }, // Week 2+: 100%
    ],
  },
  scale_up_annual: {
    durationDays: 14,
    schedule: [
      { days: 0, multiplier: 0.5 }, // Week 1: 50%
      { days: 7, multiplier: 1.0 }, // Week 2+: 100%
    ],
  },

  // Enterprise plans - 14 day faster ramp
  enterprise_monthly: {
    durationDays: 14,
    schedule: [
      { days: 0, multiplier: 0.5 }, // Week 1: 50%
      { days: 7, multiplier: 1.0 }, // Week 2+: 100%
    ],
  },
  enterprise_annual: {
    durationDays: 14,
    schedule: [
      { days: 0, multiplier: 0.5 }, // Week 1: 50%
      { days: 7, multiplier: 1.0 }, // Week 2+: 100%
    ],
  },

  // Free plan - no cooldown
  free: {
    durationDays: 0,
    schedule: [{ days: 0, multiplier: 1.0 }],
  },

  // Custom plan - no cooldown (sales-led, pre-negotiated)
  custom: {
    durationDays: 0,
    schedule: [{ days: 0, multiplier: 1.0 }],
  },

  // Default fallback - conservative 30 day ramp
  default: {
    durationDays: 30,
    schedule: [
      { days: 0, multiplier: 0.25 }, // Week 1: 25%
      { days: 7, multiplier: 0.5 }, // Week 2: 50%
      { days: 14, multiplier: 0.75 }, // Week 3: 75%
      { days: 21, multiplier: 1.0 }, // Week 4+: 100%
    ],
  },
} as const;

/**
 * Check if a value is a DodoPayments product ID (starts with 'pdt_')
 */
export function isProductId(value: string): boolean {
  return value.startsWith('pdt_');
}

/**
 * Calculate cooldown multiplier based on subscription age and plan ID
 * Returns a value between 0 and 1 representing the percentage of entitlements available
 * Falls back to default config if plan ID is not found
 */
export function getCooldownMultiplier(subscriptionCreatedAt: Date, planId: PlanId): number {
  const config = (COOLDOWN_CONFIG[planId] ?? COOLDOWN_CONFIG.default) as CooldownConfig;

  const daysSinceStart = Math.floor(
    (Date.now() - subscriptionCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Find the applicable multiplier (last one where days <= daysSinceStart)
  let multiplier: number = config.schedule[0]?.multiplier ?? 1.0;
  for (const step of config.schedule) {
    if (daysSinceStart >= step.days) {
      multiplier = step.multiplier;
    }
  }

  return multiplier;
}
