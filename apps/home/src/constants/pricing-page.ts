import type { HighlightConfig } from './types';

/**
 * Pricing page heading
 */
export const PRICING_PAGE_HEADING = {
  label: 'Pricing',
  title: 'Simple, transparent pricing',
  subtitle: 'Choose the plan that fits your team. No hidden fees, no surprises. Cancel anytime.',
};

/**
 * Pricing page heading highlights configuration
 */
export const PRICING_PAGE_HIGHLIGHTS: HighlightConfig[] = [{ wordIndex: 1, color: 'yellow' }];

/**
 * Compare plans section heading
 */
export const COMPARE_PLANS_HEADING = {
  label: 'Compare',
  title: 'Compare all plans',
  subtitle: "See exactly what's included in each plan",
};

/**
 * Compare plans heading highlights configuration
 */
export const COMPARE_PLANS_HIGHLIGHTS: HighlightConfig[] = [
  { wordIndex: 0, color: 'yellow' },
  { wordIndex: 2, color: 'blue' },
];

/**
 * Pricing FAQ section heading
 */
export const PRICING_FAQ_HEADING = {
  label: 'FAQ',
  title: 'Frequently Asked Questions',
  subtitle: 'Have a different question? Contact us',
};

/**
 * Pricing FAQ heading highlights configuration
 */
export const PRICING_FAQ_HIGHLIGHTS: HighlightConfig[] = [
  { wordIndex: 0, color: 'yellow' },
  { wordIndex: 2, color: 'blue' },
];

/**
 * Pricing page FAQ items
 */
export interface PricingFAQItem {
  question: string;
  answer: string;
}

export const PRICING_FAQ_ITEMS: PricingFAQItem[] = [
  {
    question: 'How does Userplane pricing work?',
    answer:
      'Userplane operates on a straightforward pricing model with a flat rate for all plans. Which means you pay a consistent price month-to-month with no hidden fees, no tiers, no quotas, no hidden fees.',
  },
  {
    question: 'How much does Userplane cost?',
    answer:
      'Pricing starts at $79/month. No tiers, no quotas, no hidden fees. Month-to-month with no long-term contracts.',
  },
  {
    question: 'Can I change plans at any time?',
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the change takes effect at the start of your next billing cycle.",
  },
  {
    question: 'What happens when I exceed my recording limit?',
    answer:
      "On the Essential plan, once you've used your 25 recordings for the month, you'll need to wait until the next billing cycle or upgrade to a higher plan for unlimited recordings.",
  },
  {
    question: 'Is there a discount for annual billing?',
    answer: 'Yes! When you choose annual billing, you save 20% compared to monthly billing.',
  },
  {
    question: 'Are there any cancellation fees or contracts?',
    answer: 'No contracts, no cancellation fees. Cancel anytime.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards (Visa, Mastercard, American Express) through our secure payment processor. For Enterprise plans, we also offer invoicing and custom payment terms.',
  },
  {
    question: 'How does Userplane handle sensitive data?',
    answer:
      'Userplane automatically blurs sensitive fields and redacts data at source. This means passwords, credit cards, or any other confidential information never reach our servers.',
  },
  {
    question: 'What does "Bring Your Own Storage" mean?',
    answer:
      'Bring Your Own Storage (BYOS) allows you to store your recordings and files in your own cloud storage (like AWS S3) with encrypted credentials. This gives you full control over your data.',
  },
  {
    question: 'What kind of support is included?',
    answer:
      'All plans include email support. Scale Up plans get priority support with faster response times. Enterprise customers receive dedicated support with a named account manager.',
  },
  {
    question: 'Do I need to contact sales to get started?',
    answer:
      "Not at all! You can sign up and start using Userplane right away—no sales calls required. But if you'd like to chat with a human, we're here.",
  },
  {
    question: 'Can I try Userplane for free?',
    answer:
      'While most teams prefer to start with a paid plan to get the most out of Userplane, we offer a free plan to help customers evaluate Userplane and see if it works for their team.',
  },
];
