import type { ButtonConfig, GradientConfig, IntegrationHeadline } from '@/types/integrations';

import { TALLY_SALES_FORM_URL } from '../contact';
import { SIGNUP_URL } from '../onboarding';
import { buildUTM, withUTM } from '../utm';
import { getHeroUrl } from './media';

// ── SEO ──

export const LISTING_SEO = {
  title: 'Integrations | Userplane - Screen Recordings for Your Support Stack',
  description:
    'Send recording links to customers. Get back a full replay with logs, network data, and user context.',
  keywords:
    'userplane integrations, screen recording integrations, support tool integrations, intercom integration, zendesk integration, slack integration, chrome extension',
  ogImage: '/images/preview/og-integrations.webp',
} as const;

// ── Gradient ──

export const LISTING_GRADIENT: GradientConfig = {
  stops: [
    'rgba(16, 185, 129, 0.1)',
    'rgba(45, 160, 170, 0.1)',
    'rgba(60, 130, 220, 0.1)',
    'rgba(59, 130, 246, 0.1)',
  ],
};

// ── Hero ──

export const LISTING_HERO: {
  headline: IntegrationHeadline;
  description: string[];
  primaryCTA: ButtonConfig;
  secondaryCTA: ButtonConfig;
  preview: { src: string; alt: string };
} = {
  headline: {
    lines: ['Screen Recording Links', 'for Customer Support'],
    highlights: [
      { wordIndex: 0, color: 'blue' },
      { wordIndex: 1, color: 'blue' },
      { wordIndex: 4, color: 'green' },
      { wordIndex: 5, color: 'green' },
    ],
  },
  description: [
    'Send a link and get full session replay — logs, network requests, and more.',
    'Works seamlessly with any help desk, ticketing system or internal tool.',
  ],
  primaryCTA: {
    text: 'Get started',
    href: withUTM(SIGNUP_URL, buildUTM('integration', 'integrations-listing', 'hero-primary')),
  },
  secondaryCTA: {
    text: 'View docs',
    href: withUTM(
      'https://docs.userplane.io',
      buildUTM('integration', 'integrations-listing', 'hero-secondary')
    ),
  },
  preview: {
    src: getHeroUrl('microsites/integrations/hero.png'),
    alt: 'Userplane integrations overview',
  },
};

// ── CTA ──

export const LISTING_CTA: {
  headline: IntegrationHeadline;
  description: string;
  primaryCTA: ButtonConfig;
  secondaryCTA: ButtonConfig;
} = {
  headline: {
    lines: ['Resolve support issues faster', 'with complete context upfront'],
    highlights: [
      { wordIndex: 1, color: 'blue' },
      { wordIndex: 2, color: 'blue' },
      { wordIndex: 6, color: 'green' },
      { wordIndex: 7, color: 'green' },
    ],
  },
  description:
    'Send a link and get back a complete replay with logs, network data, and session details.',
  primaryCTA: {
    text: 'Get Started',
    href: withUTM(SIGNUP_URL, buildUTM('integration', 'integrations-listing', 'cta-primary')),
  },
  secondaryCTA: {
    text: 'Talk to a Human',
    href: withUTM(
      TALLY_SALES_FORM_URL,
      buildUTM('integration', 'integrations-listing', 'cta-secondary')
    ),
  },
};
