/**
 * Shared pricing configuration for all apps
 * Provides consistent pricing plans, features, and options across the workspace
 */

// Types

/**
 * Plan identifiers - source of truth for database and pricing
 */
export const PLAN_IDS = [
  'sandbox_monthly',
  'sandbox_annual',
  'essential_monthly',
  'essential_annual',
  'starter_monthly',
  'starter_annual',
  'scale_up_monthly',
  'scale_up_annual',
  'trial_monthly',
  'trial_annual',
  'enterprise_monthly',
  'enterprise_annual',
  'early_bird_monthly',
  'early_bird_annual',
] as const;
export type PlanId = (typeof PLAN_IDS)[number];

/**
 * Resource types for entitlements
 */
export const RESOURCE_TYPE_VALUES = [
  'seats',
  'links',
  'recordings',
  'recording_links',
  'logs',
  'screenshots',
  'files',
] as const;
export type ResourceType = (typeof RESOURCE_TYPE_VALUES)[number];

/**
 * Resource limit configuration for a plan
 */
export interface ResourceLimits {
  quotedLimit: number;
  softLimit: number;
  hardLimit: number;
  upgradeLimit: number;
}

/**
 * Entitlement configuration for a plan
 */
export type PlanEntitlements = Record<ResourceType, ResourceLimits>;

/**
 * Default entitlements per plan
 * Used when provisioning a new workspace
 *
 * Limits explanation:
 * - quotedLimit: What we advertise to customers (included seats/recordings)
 * - softLimit: Warning threshold (usage alerts)
 * - hardLimit: Absolute maximum (requests blocked, "up to X members" limit)
 * - upgradeLimit: Additional capacity available beyond quotedLimit (for paid upgrades)
 *
 * Use -1 for unlimited
 */
export const PLAN_ENTITLEMENTS: Record<PlanId, PlanEntitlements> = {
  // Sandbox: Free tier for testing
  sandbox_monthly: {
    seats: { quotedLimit: 20, softLimit: 20, hardLimit: 25, upgradeLimit: 0 },
    recordings: { quotedLimit: 10, softLimit: 10, hardLimit: 15, upgradeLimit: 0 },
    recording_links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    logs: { quotedLimit: 10, softLimit: 10, hardLimit: 10, upgradeLimit: 0 },
    screenshots: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    files: { quotedLimit: 0, softLimit: 0, hardLimit: 0, upgradeLimit: 0 },
  },
  sandbox_annual: {
    seats: { quotedLimit: 20, softLimit: 20, hardLimit: 25, upgradeLimit: 0 },
    recordings: { quotedLimit: 10, softLimit: 10, hardLimit: 15, upgradeLimit: 0 },
    recording_links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    logs: { quotedLimit: 10, softLimit: 10, hardLimit: 10, upgradeLimit: 0 },
    screenshots: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    files: { quotedLimit: 0, softLimit: 0, hardLimit: 0, upgradeLimit: 0 },
  },

  // Essential: $59/mo - Entry-level paid plan
  essential_monthly: {
    seats: { quotedLimit: 5, softLimit: 5, hardLimit: 15, upgradeLimit: 10 },
    recordings: { quotedLimit: 25, softLimit: 25, hardLimit: 35, upgradeLimit: 0 },
    recording_links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    logs: { quotedLimit: 25, softLimit: 25, hardLimit: 35, upgradeLimit: 0 },
    screenshots: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    files: { quotedLimit: 0, softLimit: 0, hardLimit: 0, upgradeLimit: 0 },
  },
  essential_annual: {
    seats: { quotedLimit: 5, softLimit: 5, hardLimit: 15, upgradeLimit: 10 },
    recordings: { quotedLimit: 25, softLimit: 25, hardLimit: 35, upgradeLimit: 0 },
    recording_links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    logs: { quotedLimit: 25, softLimit: 25, hardLimit: 35, upgradeLimit: 0 },
    screenshots: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    files: { quotedLimit: 0, softLimit: 0, hardLimit: 0, upgradeLimit: 0 },
  },

  // Starter: $99/mo - For growing teams
  starter_monthly: {
    seats: { quotedLimit: 10, softLimit: 10, hardLimit: 20, upgradeLimit: 10 },
    recordings: { quotedLimit: -1, softLimit: 45, hardLimit: 85, upgradeLimit: 0 },
    recording_links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    logs: { quotedLimit: -1, softLimit: 45, hardLimit: 85, upgradeLimit: 0 },
    screenshots: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    files: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
  },
  starter_annual: {
    seats: { quotedLimit: 10, softLimit: 10, hardLimit: 20, upgradeLimit: 10 },
    recordings: { quotedLimit: -1, softLimit: 45, hardLimit: 85, upgradeLimit: 0 },
    recording_links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    logs: { quotedLimit: -1, softLimit: 45, hardLimit: 85, upgradeLimit: 0 },
    screenshots: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    files: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
  },

  // Scale Up: $249/mo - For scaling teams
  scale_up_monthly: {
    seats: { quotedLimit: 15, softLimit: 15, hardLimit: 30, upgradeLimit: 15 },
    recordings: { quotedLimit: -1, softLimit: 75, hardLimit: 250, upgradeLimit: 0 },
    recording_links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    logs: { quotedLimit: -1, softLimit: 75, hardLimit: 250, upgradeLimit: 0 },
    screenshots: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    files: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
  },
  scale_up_annual: {
    seats: { quotedLimit: 15, softLimit: 15, hardLimit: 30, upgradeLimit: 15 },
    recordings: { quotedLimit: -1, softLimit: 75, hardLimit: 250, upgradeLimit: 0 },
    recording_links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    logs: { quotedLimit: -1, softLimit: 75, hardLimit: 250, upgradeLimit: 0 },
    screenshots: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    files: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
  },

  // Trial: Free evaluation tier
  trial_monthly: {
    seats: { quotedLimit: 5, softLimit: 5, hardLimit: 15, upgradeLimit: 10 },
    recordings: { quotedLimit: 3, softLimit: 3, hardLimit: 3, upgradeLimit: 0 },
    recording_links: { quotedLimit: 5, softLimit: 5, hardLimit: 5, upgradeLimit: 0 },
    links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    logs: { quotedLimit: 3, softLimit: 3, hardLimit: 3, upgradeLimit: 0 },
    screenshots: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    files: { quotedLimit: 0, softLimit: 0, hardLimit: 0, upgradeLimit: 0 },
  },
  trial_annual: {
    seats: { quotedLimit: 5, softLimit: 5, hardLimit: 15, upgradeLimit: 10 },
    recordings: { quotedLimit: 3, softLimit: 3, hardLimit: 3, upgradeLimit: 0 },
    recording_links: { quotedLimit: 5, softLimit: 5, hardLimit: 5, upgradeLimit: 0 },
    links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    logs: { quotedLimit: 3, softLimit: 3, hardLimit: 3, upgradeLimit: 0 },
    screenshots: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    files: { quotedLimit: 0, softLimit: 0, hardLimit: 0, upgradeLimit: 0 },
  },

  // Enterprise: $650/mo - For large organizations
  enterprise_monthly: {
    seats: { quotedLimit: 30, softLimit: 30, hardLimit: 45, upgradeLimit: 15 },
    recordings: { quotedLimit: -1, softLimit: 150, hardLimit: 700, upgradeLimit: 0 },
    recording_links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    logs: { quotedLimit: -1, softLimit: 150, hardLimit: 700, upgradeLimit: 0 },
    screenshots: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    files: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
  },
  enterprise_annual: {
    seats: { quotedLimit: 30, softLimit: 30, hardLimit: 45, upgradeLimit: 15 },
    recordings: { quotedLimit: -1, softLimit: 150, hardLimit: 700, upgradeLimit: 0 },
    recording_links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    logs: { quotedLimit: -1, softLimit: 150, hardLimit: 700, upgradeLimit: 0 },
    screenshots: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    files: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
  },

  // Early Bird: Legacy plan for early customers (home page display)
  early_bird_monthly: {
    seats: { quotedLimit: 10, softLimit: 10, hardLimit: 15, upgradeLimit: 5 },
    recordings: { quotedLimit: -1, softLimit: 45, hardLimit: 50, upgradeLimit: 0 },
    recording_links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    logs: { quotedLimit: -1, softLimit: 45, hardLimit: 50, upgradeLimit: 0 },
    screenshots: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    files: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
  },
  early_bird_annual: {
    seats: { quotedLimit: 10, softLimit: 10, hardLimit: 15, upgradeLimit: 5 },
    recordings: { quotedLimit: -1, softLimit: 45, hardLimit: 50, upgradeLimit: 0 },
    recording_links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    links: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    logs: { quotedLimit: -1, softLimit: 45, hardLimit: 50, upgradeLimit: 0 },
    screenshots: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
    files: { quotedLimit: -1, softLimit: -1, hardLimit: -1, upgradeLimit: 0 },
  },
};

/**
 * Helper to get entitlements for a plan
 */
export function getPlanEntitlements(planId: PlanId): PlanEntitlements {
  return PLAN_ENTITLEMENTS[planId];
}

/**
 * Unique plan name values for type safety
 */
export const PLAN_NAME_VALUES = [
  'Sandbox',
  'Essential',
  'Starter',
  'Scale Up',
  'Trial',
  'Enterprise',
  'Early Bird',
] as const;
export type PlanName = (typeof PLAN_NAME_VALUES)[number];

/**
 * User-friendly plan names - source of truth for display names
 */
export const PLAN_NAMES: Record<PlanId, PlanName> = {
  sandbox_monthly: 'Sandbox',
  sandbox_annual: 'Sandbox',
  essential_monthly: 'Essential',
  essential_annual: 'Essential',
  starter_monthly: 'Starter',
  starter_annual: 'Starter',
  scale_up_monthly: 'Scale Up',
  scale_up_annual: 'Scale Up',
  trial_monthly: 'Trial',
  trial_annual: 'Trial',
  enterprise_monthly: 'Enterprise',
  enterprise_annual: 'Enterprise',
  early_bird_monthly: 'Early Bird',
  early_bird_annual: 'Early Bird',
};

/**
 * Default plan name for fallback
 */
export const DEFAULT_PLAN_NAME: PlanName = 'Trial';

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
 * Features for Sandbox plan
 * Free tier for testing and evaluation
 */
const SANDBOX_FEATURES: PlanFeature[] = [
  {
    text: 'Request Screen Recordings',
    included: true,
    subFeatures: [
      { text: 'Create unlimited recording links to capture customer issues', included: true },
      { text: 'Request screen recordings to spot and solve issues', included: true },
      { text: 'Replay customer issues without the back and forth', included: true },
      { text: 'Auto-blur sensitive fields and associated data', included: true },
    ],
  },
  {
    text: 'Up to 20 members per workspace',
    included: true,
    subFeatures: [
      { text: '20 seats included per month', included: true },
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
    ],
  },
  {
    text: 'Request Screenshots & Files',
    included: true,
    subFeatures: [
      { text: 'Request unlimited screenshots to understand customer issues', included: true },
      { text: 'Annotate, blur or mask sensitive data in incoming screenshots', included: true },
      { text: 'Request unlimited files from customers into your workspace', included: false },
      { text: 'Accept upto 100 GB per file', included: false },
      {
        text: 'Bring your own storage (BYOS) with encrypted storage credentials (AWS KMS)',
        included: false,
      },
    ],
  },
  {
    text: 'Customize Recording Links',
    included: true,
    subFeatures: [
      { text: 'Customize with your logo', included: true },
      { text: 'Remove userplane branding', included: true },
    ],
  },
  {
    text: 'Privacy & compliance',
    included: true,
    subFeatures: [
      { text: 'Auto-blur sensitive data', included: true },
      { text: 'Enterprise-grade compliance', included: true },
      { text: 'Custom data retention policy', included: true },
      { text: 'Bring your own storage (BYOS)', included: false },
      { text: 'Data Residency Controls (US/EU)', included: false },
    ],
  },
  {
    text: 'Workspace Integrations',
    included: true,
    subFeatures: [
      { text: 'Integrate with Helpdesks such as Intercom, Zendesk and more', included: true },
      { text: 'Integrate with CRMs such as Salesforce, Hubspot and more', included: true },
      { text: 'Integrate with issue trackers such as Jira, Linear and more', included: true },
      {
        text: 'Integrate with workflow automation tools such as Zapier, n8n and more',
        included: true,
      },
      { text: 'Custom integrations and API access', included: true },
    ],
  },
];

/**
 * Features for Essential plan
 * Entry-level paid plan for small teams
 */
const ESSENTIAL_FEATURES: PlanFeature[] = [
  {
    text: 'Request Screen Recordings',
    included: true,
    subFeatures: [
      { text: 'Create unlimited recording links to capture customer issues', included: true },
      {
        text: 'Request upto 25 screen recordings per month to spot and solve issues',
        included: true,
      },
      { text: 'Replay customer issues without the back and forth', included: true },
      { text: 'Auto-blur sensitive fields and associated data', included: true },
    ],
  },
  {
    text: 'Up to 15 members per workspace',
    included: true,
    subFeatures: [
      { text: '5 seats included per month', included: true },
      { text: 'Request additional seats', included: true },
    ],
  },
  {
    text: 'Capture console & network logs',
    included: false,
    subFeatures: [
      { text: 'Capture browser logs', included: false },
      { text: 'Capture network activity', included: false },
      { text: 'Capture server-side logs', included: false },
      { text: 'Replay user actions', included: false },
    ],
  },
  {
    text: 'Request Screenshots & Files',
    included: true,
    subFeatures: [
      { text: 'Request unlimited screenshots to understand customer issues', included: true },
      { text: 'Annotate, blur or mask sensitive data in incoming screenshots', included: true },
      { text: 'Request unlimited files from customers into your workspace', included: false },
      { text: 'Accept upto 100 GB per file', included: false },
      {
        text: 'Bring your own storage (BYOS) with encrypted storage credentials (AWS KMS)',
        included: false,
      },
    ],
  },
  {
    text: 'Customize Recording Links',
    included: false,
    subFeatures: [
      { text: 'Customize with your logo', included: false },
      { text: 'Remove userplane branding', included: false },
    ],
  },
  {
    text: 'Privacy & compliance',
    included: false,
    subFeatures: [
      { text: 'Auto-blur sensitive data', included: true },
      { text: 'Enterprise-grade compliance', included: true },
      { text: 'Custom data retention policy', included: true },
      { text: 'Bring your own storage (BYOS)', included: false },
      { text: 'Data Residency Controls (US/EU)', included: false },
    ],
  },
  {
    text: 'Workspace Integrations',
    included: true,
    subFeatures: [
      { text: 'Integrate with Helpdesks such as Intercom, Zendesk and more', included: true },
      { text: 'Integrate with CRMs such as Salesforce, Hubspot and more', included: true },
      { text: 'Integrate with issue trackers such as Jira, Linear and more', included: true },
      {
        text: 'Integrate with workflow automation tools such as Zapier, n8n and more',
        included: true,
      },
      { text: 'Custom integrations and API access', included: true },
    ],
  },
];

/**
 * Features for Starter plan
 * For growing teams with more recording needs
 */
const STARTER_FEATURES: PlanFeature[] = [
  {
    text: 'Request Screen Recordings',
    included: true,
    subFeatures: [
      { text: 'Create unlimited recording links to capture customer issues', included: true },
      {
        text: 'Request unlimited screen recordings per month to spot and solve issues',
        included: true,
      },
      { text: 'Replay customer issues without the back and forth', included: true },
      { text: 'Auto-blur sensitive fields and associated data', included: true },
    ],
  },
  {
    text: 'Up to 20 members per workspace',
    included: true,
    subFeatures: [
      { text: '10 seats included per month', included: true },
      { text: 'Request additional seats', included: true },
    ],
  },
  {
    text: 'Capture console & network logs',
    included: true,
    subFeatures: [
      { text: 'Capture browser logs', included: true },
      { text: 'Capture network activity', included: true },
      { text: 'Capture server-side logs', included: false },
      { text: 'Replay user actions', included: true },
    ],
  },
  {
    text: 'Request Screenshots & Files',
    included: true,
    subFeatures: [
      { text: 'Request unlimited screenshots to understand customer issues', included: true },
      { text: 'Annotate, blur or mask sensitive data in incoming screenshots', included: true },
      { text: 'Request unlimited files from customers into your workspace', included: true },
      { text: 'Accept upto 100 GB per file', included: true },
      {
        text: 'Bring your own storage (BYOS) with encrypted storage credentials (AWS KMS)',
        included: true,
      },
    ],
  },
  {
    text: 'Customize Recording Links',
    included: true,
    subFeatures: [
      { text: 'Customize with your logo', included: true },
      { text: 'Remove userplane branding', included: true },
    ],
  },
  {
    text: 'Privacy & compliance',
    included: false,
    subFeatures: [
      { text: 'Auto-blur sensitive data', included: true },
      { text: 'Enterprise-grade compliance', included: true },
      { text: 'Custom data retention policy', included: true },
      { text: 'Bring your own storage (BYOS)', included: false },
      { text: 'Data Residency Controls (US/EU)', included: false },
    ],
  },
  {
    text: 'Workspace Integrations',
    included: true,
    subFeatures: [
      { text: 'Integrate with Helpdesks such as Intercom, Zendesk and more', included: true },
      { text: 'Integrate with CRMs such as Salesforce, Hubspot and more', included: true },
      { text: 'Integrate with issue trackers such as Jira, Linear and more', included: true },
      {
        text: 'Integrate with workflow automation tools such as Zapier, n8n and more',
        included: true,
      },
      { text: 'Custom integrations and API access', included: true },
    ],
  },
];

/**
 * Features for Scale Up plan
 * For larger teams with advanced needs
 */
const SCALE_UP_FEATURES: PlanFeature[] = [
  {
    text: 'Request Screen Recordings',
    included: true,
    subFeatures: [
      { text: 'Create unlimited recording links to capture customer issues', included: true },
      {
        text: 'Request unlimited screen recordings per month to spot and solve issues',
        included: true,
      },
      { text: 'Replay customer issues without the back and forth', included: true },
      { text: 'Auto-blur sensitive fields and associated data', included: true },
    ],
  },
  {
    text: 'Up to 30 members per workspace',
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
      { text: 'Capture server-side logs', included: true },
      { text: 'Replay user actions', included: true },
    ],
  },
  {
    text: 'Request Screenshots & Files',
    included: true,
    subFeatures: [
      { text: 'Request unlimited screenshots to understand customer issues', included: true },
      { text: 'Annotate, blur or mask sensitive data in incoming screenshots', included: true },
      { text: 'Request unlimited files from customers into your workspace', included: true },
      { text: 'Accept upto 100 GB per file', included: true },
      {
        text: 'Bring your own storage (BYOS) with encrypted storage credentials (AWS KMS)',
        included: true,
      },
    ],
  },
  {
    text: 'Customize Recording Links',
    included: true,
    subFeatures: [
      { text: 'Customize with your logo', included: true },
      { text: 'Remove userplane branding', included: true },
    ],
  },
  {
    text: 'Privacy & compliance',
    included: false,
    subFeatures: [
      { text: 'Auto-blur sensitive data', included: true },
      { text: 'Enterprise-grade compliance', included: true },
      { text: 'Custom data retention policy', included: true },
      { text: 'Bring your own storage (BYOS)', included: false },
      { text: 'Data Residency Controls (US/EU)', included: false },
    ],
  },
  {
    text: 'Workspace Integrations',
    included: true,
    subFeatures: [
      { text: 'Integrate with Helpdesks such as Intercom, Zendesk and more', included: true },
      { text: 'Integrate with CRMs such as Salesforce, Hubspot and more', included: true },
      { text: 'Integrate with issue trackers such as Jira, Linear and more', included: true },
      {
        text: 'Integrate with workflow automation tools such as Zapier, n8n and more',
        included: true,
      },
      { text: 'Custom integrations and API access', included: true },
    ],
  },
];

/**
 * Features for Trial plan
 * Limited free tier for evaluation
 */
const TRIAL_FEATURES: PlanFeature[] = [
  {
    text: 'Request Screen Recordings',
    included: true,
    subFeatures: [
      { text: 'Create unlimited recording links to capture customer issues', included: true },
      {
        text: 'Request upto 3 screen recordings per month to spot and solve issues',
        included: true,
      },
      { text: 'Replay customer issues without the back and forth', included: true },
      { text: 'Auto-blur sensitive fields and associated data', included: true },
    ],
  },
  {
    text: 'Up to 15 members per workspace',
    included: true,
    subFeatures: [
      { text: '5 seats included per month', included: true },
      { text: 'Request additional seats', included: true },
    ],
  },
  {
    text: 'Capture console & network logs',
    included: false,
    subFeatures: [
      { text: 'Capture browser logs', included: false },
      { text: 'Capture network activity', included: false },
      { text: 'Capture server-side logs', included: false },
      { text: 'Replay user actions', included: false },
    ],
  },
  {
    text: 'Request Screenshots & Files',
    included: true,
    subFeatures: [
      { text: 'Request unlimited screenshots to understand customer issues', included: true },
      { text: 'Annotate, blur or mask sensitive data in incoming screenshots', included: true },
      { text: 'Request unlimited files from customers into your workspace', included: false },
      { text: 'Accept upto 100 GB per file', included: false },
      {
        text: 'Bring your own storage (BYOS) with encrypted storage credentials (AWS KMS)',
        included: false,
      },
    ],
  },
  {
    text: 'Customize Recording Links',
    included: true,
    subFeatures: [
      { text: 'Customize with your logo', included: true },
      { text: 'Remove userplane branding', included: true },
    ],
  },
  {
    text: 'Privacy & compliance',
    included: true,
    subFeatures: [
      { text: 'Auto-blur sensitive data', included: true },
      { text: 'Enterprise-grade compliance', included: true },
      { text: 'Custom data retention policy', included: true },
      { text: 'Bring your own storage (BYOS)', included: false },
      { text: 'Data Residency Controls (US/EU)', included: false },
    ],
  },
  {
    text: 'Workspace Integrations',
    included: true,
    subFeatures: [
      { text: 'Integrate with Helpdesks such as Intercom, Zendesk and more', included: true },
      { text: 'Integrate with CRMs such as Salesforce, Hubspot and more', included: true },
      { text: 'Integrate with issue trackers such as Jira, Linear and more', included: true },
      {
        text: 'Integrate with workflow automation tools such as Zapier, n8n and more',
        included: true,
      },
      { text: 'Custom integrations and API access', included: true },
    ],
  },
];

/**
 * Features for Enterprise plan
 * Full-featured plan for large organizations
 */
const ENTERPRISE_FEATURES: PlanFeature[] = [
  {
    text: 'Request Screen Recordings',
    included: true,
    subFeatures: [
      { text: 'Create unlimited recording links to capture customer issues', included: true },
      {
        text: 'Request unlimited screen recordings per month to spot and solve issues',
        included: true,
      },
      { text: 'Replay customer issues without the back and forth', included: true },
      { text: 'Auto-blur sensitive fields and associated data', included: true },
    ],
  },
  {
    text: 'Up to 45 members per workspace',
    included: true,
    subFeatures: [
      { text: '30 seats included per month', included: true },
      { text: 'Request additional seats', included: true },
    ],
  },
  {
    text: 'Capture console & network logs',
    included: true,
    subFeatures: [
      { text: 'Capture browser logs', included: true },
      { text: 'Capture network activity', included: true },
      { text: 'Capture server-side logs', included: true },
      { text: 'Replay user actions', included: true },
    ],
  },
  {
    text: 'Request Screenshots & Files',
    included: true,
    subFeatures: [
      { text: 'Request unlimited screenshots to understand customer issues', included: true },
      { text: 'Annotate, blur or mask sensitive data in incoming screenshots', included: true },
      { text: 'Request unlimited files from customers into your workspace', included: true },
      { text: 'Accept upto 100 GB per file', included: true },
      {
        text: 'Bring your own storage (BYOS) with encrypted storage credentials (AWS KMS)',
        included: true,
      },
    ],
  },
  {
    text: 'Customize Recording Links',
    included: true,
    subFeatures: [
      { text: 'Customize with your logo', included: true },
      { text: 'Remove userplane branding', included: true },
    ],
  },
  {
    text: 'Privacy & compliance',
    included: true,
    subFeatures: [
      { text: 'Auto-blur sensitive data', included: true },
      { text: 'Enterprise-grade compliance', included: true },
      { text: 'Custom data retention policy', included: true },
      { text: 'Bring your own storage (BYOS)', included: true },
      { text: 'Data Residency Controls (US/EU)', included: true },
    ],
  },
  {
    text: 'Workspace Integrations',
    included: true,
    subFeatures: [
      { text: 'Integrate with Helpdesks such as Intercom, Zendesk and more', included: true },
      { text: 'Integrate with CRMs such as Salesforce, Hubspot and more', included: true },
      { text: 'Integrate with issue trackers such as Jira, Linear and more', included: true },
      {
        text: 'Integrate with workflow automation tools such as Zapier, n8n and more',
        included: true,
      },
      { text: 'Custom integrations and API access', included: true },
    ],
  },
];

/**
 * Features for Early Bird plan
 * Legacy plan for early customers (displayed on home page)
 */
const EARLY_BIRD_FEATURES: PlanFeature[] = [
  {
    text: 'Unlimited Screen Recordings',
    included: true,
    subFeatures: [
      {
        text: 'Request unlimited recordings to spot and solve issues',
        included: true,
      },
    ],
  },
  {
    text: 'Replay Customer Issues',
    included: true,
    subFeatures: [
      {
        text: 'Know exactly what happened, without the back and forth',
        included: true,
      },
    ],
  },
  {
    text: 'Redact Confidential Data',
    included: true,
    subFeatures: [
      {
        text: 'Mask confidential fields and sensitive data from recordings',
        included: true,
      },
    ],
  },
];

/**
 * All pricing plans with monthly and annual variants
 */
export const BASE_PRICING_PLANS: BasePricingPlan[] = [
  // Sandbox Monthly
  {
    id: 'sandbox_monthly',
    name: 'Sandbox',
    description: 'Free tier for testing and evaluation',
    details: {
      planType: 'one_time',
      planRate: 0,
      planCycle: 'monthly',
    },
    features: SANDBOX_FEATURES,
  },
  // Sandbox Annual
  {
    id: 'sandbox_annual',
    name: 'Sandbox',
    description: 'Free tier for testing and evaluation',
    details: {
      planType: 'one_time',
      planRate: 0,
      planCycle: 'annual',
    },
    features: SANDBOX_FEATURES,
  },
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
    features: ESSENTIAL_FEATURES,
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
    features: ESSENTIAL_FEATURES,
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
    features: STARTER_FEATURES,
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
    features: STARTER_FEATURES,
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
    features: SCALE_UP_FEATURES,
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
    features: SCALE_UP_FEATURES,
    isPopular: true,
  },
  // Trial Monthly
  {
    id: 'trial_monthly',
    name: 'Trial',
    description: 'Try Userplane for free',
    details: {
      planType: 'one_time',
      planRate: 0,
      planCycle: 'monthly',
    },
    features: TRIAL_FEATURES,
  },
  // Trial Annual
  {
    id: 'trial_annual',
    name: 'Trial',
    description: 'Try Userplane for free',
    details: {
      planType: 'one_time',
      planRate: 0,
      planCycle: 'annual',
    },
    features: TRIAL_FEATURES,
  },
  // Enterprise Monthly
  {
    id: 'enterprise_monthly',
    name: 'Enterprise',
    description: 'For large teams and organizations',
    details: {
      planType: 'subscription',
      planRate: 650,
      planCycle: 'monthly',
    },
    features: ENTERPRISE_FEATURES,
    isEnterprise: true,
  },
  // Enterprise Annual
  {
    id: 'enterprise_annual',
    name: 'Enterprise',
    description: 'For large teams and organizations',
    details: {
      planType: 'subscription',
      planRate: 520,
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
  // Early Bird Annual
  {
    id: 'early_bird_annual',
    name: 'Early Bird',
    description: 'For early Userplane customers',
    details: {
      planType: 'subscription',
      planRate: 79,
      planCycle: 'annual',
    },
    features: EARLY_BIRD_FEATURES,
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
