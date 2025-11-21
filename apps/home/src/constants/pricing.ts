import { CAL_URL } from './contact';

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
          { text: 'Upto 45 days of retention', included: true },
          { text: 'Upto 3 minutes per recording', included: true },
          { text: 'Upto 90 minutes per month', included: true },
          { text: 'Pay as you go usage-based pricing', included: true },
        ],
      },
      {
        text: 'Upto 15 members per workspace',
        included: true,
        subFeatures: [
          { text: '5 seats included per month', included: true },
          { text: 'Pay as you go usage-based pricing', included: true },
        ],
      },
      {
        text: 'Workspace Support',
        included: true,
        subFeatures: [
          { text: 'Onboarding Customer Support', included: true },
          { text: 'Ongoing Customer Support', included: true },
          { text: 'Dedicated Customer Success Team', included: false },
          { text: 'Dedicated Implementation Team', included: false },
        ],
      },
      {
        text: 'Workspace Integrations',
        included: true,
        subFeatures: [
          { text: 'Helpdesk integrations (Zendesk, Freshdesk, etc.)', included: true },
          { text: 'Issue tracker integrations (Jira, Linear, etc.)', included: true },
          { text: 'Workflow integrations (Zapier, N8N, etc.)', included: true },
          { text: 'CRM integrations (Hubspot, Salesforce, etc.)', included: true },
          { text: 'Custom integrations and API access', included: false },
        ],
      },
      {
        text: 'Workspace Privacy and Security',
        included: true,
        subFeatures: [
          { text: 'Auto-blur sensitive data', included: true },
          { text: 'Google SSO', included: true },
          { text: 'Enterprise-grade auditability', included: false },
          { text: '2FA', included: false },
          { text: 'SAML SSO', included: false },
          { text: 'Granular RBAC and Access Controls', included: false },
        ],
      },
      {
        text: 'Workspace Storage',
        included: true,
        subFeatures: [
          { text: 'Bring your own storage (BYOS)', included: false },
          { text: 'Data Residency Controls (US/EU)', included: false },
          { text: 'Upto 45 days of retention', included: true },
        ],
      },
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
      {
        text: 'Unlimited recordings per month',
        included: true,
        subFeatures: [
          { text: 'Upto 180 days of retention', included: true },
          { text: 'Upto 5 minutes per recording', included: true },
          { text: 'Upto 360 minutes per month', included: true },
          { text: 'Pay as you go usage-based pricing', included: true },
        ],
      },
      {
        text: 'Upto 45 members per workspace',
        included: true,
        subFeatures: [
          { text: '15 seats included per month', included: true },
          { text: 'Pay as you go usage-based pricing', included: true },
        ],
      },
      {
        text: 'Workspace Support',
        included: true,
        subFeatures: [
          { text: 'Onboarding Customer Support', included: true },
          { text: 'Ongoing Customer Support', included: true },
          { text: 'Dedicated Customer Success Team', included: true },
          { text: 'Dedicated Implementation Team', included: false },
        ],
      },
      {
        text: 'Workspace Integrations',
        included: true,
        subFeatures: [
          { text: 'Helpdesk integrations (Zendesk, Freshdesk, etc.)', included: true },
          { text: 'Issue tracker integrations (Jira, Linear, etc.)', included: true },
          { text: 'Workflow integrations (Zapier, N8N, etc.)', included: true },
          { text: 'CRM integrations (Hubspot, Salesforce, etc.)', included: true },
          { text: 'Custom integrations and API access', included: true },
        ],
      },
      {
        text: 'Workspace Privacy and Security',
        included: true,
        subFeatures: [
          { text: 'Auto-blur sensitive data', included: true },
          { text: 'Google SSO', included: true },
          { text: 'Enterprise-grade auditability', included: false },
          { text: '2FA', included: false },
          { text: 'SAML SSO', included: false },
          { text: 'Granular RBAC and Access Controls', included: false },
        ],
      },
      {
        text: 'Workspace Storage',
        included: true,
        subFeatures: [
          { text: 'Bring your own storage (BYOS)', included: false },
          { text: 'Data Residency Controls (US/EU)', included: false },
          { text: 'Upto 180 days of retention', included: true },
        ],
      },
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
      {
        text: 'Unlimited recordings per month',
        included: true,
        subFeatures: [
          { text: 'Unlimited days of retention', included: true },
          { text: 'Upto 10 minutes per recording', included: true },
          { text: 'Unlimited minutes per month', included: true },
          { text: 'Pay as you go usage-based pricing', included: true },
        ],
      },
      {
        text: 'Unlimited members per workspace',
        included: true,
        subFeatures: [
          { text: 'Custom members per workspace', included: true },
          { text: 'Pay as you go usage-based pricing', included: true },
        ],
      },
      {
        text: 'Workspace Support',
        included: true,
        subFeatures: [
          { text: 'Onboarding Customer Support', included: true },
          { text: 'Ongoing Customer Support', included: true },
          { text: 'Dedicated Customer Success Team', included: true },
          { text: 'Dedicated Implementation Team', included: true },
        ],
      },
      {
        text: 'Workspace Integrations',
        included: true,
        subFeatures: [
          { text: 'Helpdesk integrations (Zendesk, Freshdesk, etc.)', included: true },
          { text: 'Issue tracker integrations (Jira, Linear, etc.)', included: true },
          { text: 'Workflow integrations (Zapier, N8N, etc.)', included: true },
          { text: 'CRM integrations (Hubspot, Salesforce, etc.)', included: true },
          { text: 'Custom integrations and API access', included: true },
        ],
      },
      {
        text: 'Workspace Privacy and Security',
        included: true,
        subFeatures: [
          { text: 'Auto-blur sensitive data', included: true },
          { text: 'Google SSO', included: true },
          { text: 'Enterprise-grade auditability', included: true },
          { text: '2FA', included: true },
          { text: 'SAML SSO', included: true },
          { text: 'Granular RBAC and Access Controls', included: true },
        ],
      },
      {
        text: 'Workspace Storage',
        included: true,
        subFeatures: [
          { text: 'Bring your own storage (BYOS)', included: true },
          { text: 'Data Residency Controls (US/EU)', included: true },
          { text: 'Configurable Data Lifecycle Controls', included: true },
        ],
      },
    ],
    ctaText: 'Contact Sales',
    ctaUrl: CAL_URL,
    ctaIsExternal: true,
    isEnterprise: true,
  },
];
