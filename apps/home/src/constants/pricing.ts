import { TALLY_SALES_FORM_URL } from './contact';
import { SIGNUP_URL } from './onboarding';

/**
 * Plan feature
 */
export interface PlanFeature {
  text: string;
  included?: boolean;
  subFeatures?: PlanFeature[];
}

/**
 * Pricing plan
 */
export interface PricingPlan {
  id: string;
  name: string;
  annualMonthlyRate: string;
  monthlyPrice: string;
  description: string;
  features: PlanFeature[];
  ctaText: string;
  ctaUrl: string;
  ctaIsExternal?: boolean;
  isPopular?: boolean;
  isEnterprise?: boolean;
}

/**
 * Pricing section title
 */
export const PRICING_TITLE = 'Pricing';

/**
 * Pricing section subtitle
 */
export const PRICING_SUBTITLE = 'Pricing that works for you';

/**
 * Pricing plans
 */
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter_plan',
    name: 'Starter',
    annualMonthlyRate: '$49',
    monthlyPrice: '$64',
    description: 'For early stage startups starting out',
    features: [
      {
        text: 'Unlimited recordings per month',
        included: true,
        subFeatures: [
          { text: 'Upto 3 minutes per recording', included: true },
          { text: 'Upto 90 minutes per month', included: true },
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
    ],
    ctaText: 'Start Trial',
    ctaUrl: SIGNUP_URL,
  },
  {
    id: 'scaleup_plan',
    name: 'Scaleup',
    annualMonthlyRate: '$199',
    monthlyPrice: '$249',
    description: 'For scaleups looking to grow',
    features: [
      {
        text: 'Unlimited recordings per month',
        included: true,
        subFeatures: [
          { text: 'Upto 5 minutes per recording', included: true },
          { text: 'Upto 360 minutes per month', included: true },
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
    ],
    ctaText: 'Start Trial',
    ctaUrl: SIGNUP_URL,
    isPopular: true,
  },
  {
    id: 'enterprise_plan',
    name: 'Enterprise',
    annualMonthlyRate: 'Custom',
    monthlyPrice: 'Custom',
    description: 'For enterprises looking to scale',
    features: [
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
    ],
    ctaText: 'Contact Sales',
    ctaUrl: TALLY_SALES_FORM_URL,
    ctaIsExternal: true,
    isEnterprise: true,
  },
];
