import { CAL_URL } from './contact';

/**
 * Plan feature
 */
export interface PlanFeature {
  text: string;
  included?: boolean;
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
      { text: 'Unlimited recordings per month', included: true },
      { text: 'Upto 15 members per workspace', included: true },
      { text: 'Upto 45 days of retention', included: true },
      { text: 'Upto 3 minutes of recording length', included: true },
      { text: 'Auto-blur sensitive data', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'Helpdesk integrations (Zendesk, Freshdesk, etc.)', included: true },
      { text: 'Issue tracker integrations (Jira, Linear, etc.)', included: true },
      { text: 'Workflow integrations (Zapier, N8N, etc.)', included: true },
      { text: 'CRM integrations (Hubspot, Salesforce, etc.)', included: true },
      { text: 'Custom integrations and API access', included: false },
      { text: 'Bring your own storage', included: false },
      { text: 'Data residency and lifecycle controls', included: false },
      { text: 'SAML SSO', included: false },
    ],
    ctaText: 'Start Trial',
    ctaUrl: '/get-started?step=1',
  },
  {
    id: 'scaleup_plan',
    name: 'Scaleup',
    annualMonthlyRate: '$199',
    monthlyPrice: '$249',
    description: 'For scaleups looking to grow',
    features: [
      { text: 'Unlimited recordings per month', included: true },
      { text: 'Upto 45 members per workspace', included: true },
      { text: 'Upto 180 days of retention', included: true },
      { text: 'Upto 5 minutes of recording length', included: true },
      { text: 'Auto-blur sensitive data', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'Helpdesk integrations (Zendesk, Freshdesk, etc.)', included: true },
      { text: 'Issue tracker integrations (Jira, Linear, etc.)', included: true },
      { text: 'Workflow integrations (Zapier, N8N, etc.)', included: true },
      { text: 'CRM integrations (Hubspot, Salesforce, etc.)', included: true },
      { text: 'Custom integrations and API access', included: true },
      { text: 'Bring your own storage', included: false },
      { text: 'Data residency and lifecycle controls', included: false },
      { text: 'SAML SSO', included: false },
    ],
    ctaText: 'Start Trial',
    ctaUrl: CAL_URL,
    ctaIsExternal: true,
    isPopular: true,
  },
  {
    id: 'enterprise_plan',
    name: 'Enterprise',
    annualMonthlyRate: 'Custom',
    monthlyPrice: 'Custom',
    description: 'For enterprises looking to scale',
    features: [
      { text: 'Unlimited recordings per month', included: true },
      { text: 'Unlimited members per workspace', included: true },
      { text: 'Unlimited days of retention', included: true },
      { text: '10 minutes of recording length', included: true },
      { text: 'Auto-blur sensitive data', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'Helpdesk integrations (Zendesk, Freshdesk, etc.)', included: true },
      { text: 'Issue tracker integrations (Jira, Linear, etc.)', included: true },
      { text: 'Workflow integrations (Zapier, N8N, etc.)', included: true },
      { text: 'CRM integrations (Hubspot, Salesforce, etc.)', included: true },
      { text: 'Custom integrations and API access', included: true },
      { text: 'Bring your own storage', included: true },
      { text: 'Data residency and lifecycle controls', included: true },
      { text: 'SAML SSO', included: true },
    ],
    ctaText: 'Contact Sales',
    ctaUrl: CAL_URL,
    ctaIsExternal: true,
    isEnterprise: true,
  },
];
