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
  isPopular?: boolean;
  isEnterprise?: boolean;
}

/**
 * Pricing plans
 */
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'solo_plan',
    name: 'Solo',
    annualMonthlyRate: '$67',
    monthlyPrice: '$79',
    description: 'For individual VCs tracking their deal flow',
    features: [
      { text: 'Track up to 10 companies', included: true },
      { text: 'Monitor up to 50 pages', included: true },
      { text: 'Refresh every 3 days', included: true },
      { text: 'Email integration', included: true },
      { text: 'CRM integration (Affinity, AngelList)', included: false },
    ],
    ctaText: 'Start Tracking',
  },
  {
    id: 'team_plan',
    name: 'Fund',
    annualMonthlyRate: '$208',
    monthlyPrice: '$249',
    description: 'For investment teams and small funds',
    features: [
      { text: 'Track up to 50 companies', included: true },
      { text: 'Monitor up to 100 pages', included: true },
      { text: 'Refresh every 3 days', included: true },
      { text: 'Email integrations', included: true },
      { text: 'Dedicated success manager', included: true },
      { text: 'CRM integrations (Affinity, AngelList)', included: false },
    ],
    ctaText: 'Contact Sales',
    isPopular: true,
  },
  {
    id: 'custom_plan',
    name: 'Enterprise',
    annualMonthlyRate: 'Custom',
    monthlyPrice: 'Custom',
    description: 'For large funds with extensive deal flow',
    features: [
      { text: 'Unlimited company tracking', included: true },
      { text: 'Unlimited page monitoring', included: true },
      { text: 'Refresh every 1 day', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'Dedicated success manager', included: true },
      { text: 'Enterprise compliance (SOC2, GDPR)', included: true },
    ],
    ctaText: 'Contact Sales',
    isEnterprise: true,
  },
];
