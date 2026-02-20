import type { HighlightConfig } from './types';

/**
 * FAQ link configuration
 * `text` is matched within the answer string and rendered as a link
 */
export interface FAQLink {
  text: string;
  href: string;
}

/**
 * FAQ item interface
 */
export interface FAQItem {
  question: string;
  answer: string;
  link?: FAQLink;
}

/**
 * FAQ section heading
 */
export const FAQ_HEADING = {
  label: 'FAQ',
  title: 'Frequently Asked Questions',
  subtitle: 'Want to learn more about Userplane? Start here',
};

/**
 * FAQ heading highlights configuration
 */
export const FAQ_HIGHLIGHTS: HighlightConfig[] = [
  { wordIndex: 0, color: 'yellow' },
  { wordIndex: 2, color: 'blue' },
];

/**
 * FAQ items list
 */
export const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How does Userplane work?',
    answer:
      'Userplane provides one-click recording links that work everywhere. No apps, installs, or browser extensions needed. Just share a link with your customer, and they can record their screen showing the issue.',
  },
  {
    question: 'What data does Userplane capture?',
    answer:
      'Userplane captures screen recordings showing exactly what your customer experienced. This gives you complete visibility into what went wrong.',
  },
  {
    question: 'How does Userplane handle sensitive data?',
    answer:
      'Userplane automatically blurs sensitive fields and redacts data at source. This means passwords, credit cards, or any other confidential information never reach our servers.',
  },
  {
    question: 'Do my customers need to install anything?',
    answer:
      'No. Userplane works entirely through a simple link. No apps, installs, or browser extensions required.',
  },
  {
    question: 'What browsers does Userplane support?',
    answer: 'Userplane works on all modern browsers including Chrome, Firefox, Safari, and Edge.',
  },
  {
    question: 'Can I integrate Userplane with Intercom?',
    answer:
      'Yes, Userplane has a best-in-class Intercom integration. You can request and receive screen recordings without leaving Intercom.',
  },
  {
    question: 'How much does Userplane cost?',
    answer:
      'Simple pricing starting at $79/month. No tiers, no quotas, no hidden fees. Month-to-month with no long-term contracts.',
  },
  {
    question: 'Which plan would work best for my team?',
    answer:
      "Starter is a great fit for most teams getting started. For a detailed breakdown of what's included in each plan, take a look at our pricing page.",
    link: { text: 'pricing page', href: '/pricing' },
  },
  {
    question: 'Can I try Userplane for free?',
    answer:
      'While most teams prefer to start with a paid plan to get the most out of Userplane, we offer a free plan to help customers evaluate Userplane and see if it works for their team.',
  },
  {
    question: 'Can I request a trial for the paid plans?',
    answer: 'Yes! Every paid plan comes with a 14-day free trial. Cancel anytime.',
  },
  {
    question: 'Can I add more seats to my plan?',
    answer:
      'Absolutely. You can request additional seats via add-ons. New seats are prorated for the rest of your billing cycle, so you never overpay.',
  },
  {
    question: 'Do you offer custom pricing for larger teams?',
    answer:
      "We do! If you have a larger team or specific requirements, reach out and we'll put together a custom quote that fits your needs.",
  },
  {
    question: 'Are there any cancellation fees or contracts?',
    answer: 'Nope. No contracts, no cancellation fees. Cancel anytime.',
  },
  {
    question: 'Do I need to contact sales to get started?',
    answer:
      "Not at all! You can sign up and start using Userplane right away—no sales calls required. But if you'd like to chat with a human, we're here.",
  },
  {
    question: 'What kind of support does Userplane offer?',
    answer:
      'We provide around-the-clock support with real humans. You can typically expect your first response within 12 hours.',
  },
];
