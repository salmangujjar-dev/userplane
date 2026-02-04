import type { HighlightConfig } from '../types';

/**
 * FAQ item interface
 */
export interface FAQItem {
  question: string;
  answer: string;
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
    question: 'Can I try Userplane for free?',
    answer:
      'While most teams prefer to start with a paid plan to get the most out of Userplane, we offer a free plan to help customers evaluate Userplane and see if it works for their team.',
  },
  {
    question: 'How much does Userplane cost?',
    answer:
      'Simple pricing starting at $79/month. No tiers, no quotas, no hidden fees. Month-to-month with no long-term contracts.',
  },
  {
    question: 'How does Userplane pricing work?',
    answer:
      'Userplane operates on a straightforward pricing model with a flat rate for all plans. Which means you pay a consistent price month-to-month with no hidden fees, no tiers, no quotas, no hidden fees.',
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
