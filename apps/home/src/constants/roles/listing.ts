import type { ButtonConfig, GradientConfig, IntegrationHeadline } from '@/types/roles';

import { TALLY_SALES_FORM_URL } from '../contact';
import { SIGNUP_URL } from '../onboarding';
import { buildUTM, withUTM } from '../utm';
import { getRoleHeroUrl } from './media';

// ── SEO ──

export const LISTING_SEO = {
  title:
    'Userplane for Your Team | Screen Recordings with Console Logs, Network Requests, and Session Data',
  description:
    'Userplane gives every team full visibility into customer issues. Screen recordings with console logs, network data, and session metadata.',
  keywords:
    'userplane, screen recording, session replay, support tools, developer tools, customer success, console logs, network data',
} as const;

// ── Gradient ──

export const LISTING_GRADIENT: GradientConfig = {
  stops: [
    'rgba(245, 158, 11, 0.1)',
    'rgba(59, 130, 246, 0.1)',
    'rgba(16, 185, 129, 0.1)',
    'rgba(139, 92, 246, 0.1)',
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
    lines: ['Built for every team', 'that touches support'],
    highlights: [
      { wordIndex: 5, color: 'blue' },
      { wordIndex: 6, color: 'blue' },
    ],
  },
  description: [
    'Request screen recordings with logs, network requests, and session data.',
    'Resolve issues on first contact. Skip the back-and-forth.',
  ],
  primaryCTA: {
    text: 'Get Started',
    href: withUTM(SIGNUP_URL, buildUTM('role', 'roles-listing', 'hero-primary')),
  },
  secondaryCTA: {
    text: 'Talk to a Human',
    href: withUTM(TALLY_SALES_FORM_URL, buildUTM('role', 'roles-listing', 'hero-secondary')),
  },
  preview: {
    src: getRoleHeroUrl('microsites/roles/support-agents/hero.png'),
    alt: 'Userplane screen recording with full technical context',
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
    lines: ['Complete visibility into every customer issue'],
    highlights: [
      { wordIndex: 0, color: 'blue' },
      { wordIndex: 1, color: 'blue' },
      { wordIndex: 4, color: 'green' },
      { wordIndex: 5, color: 'green' },
    ],
  },
  description:
    'Screen recordings with console logs, network requests, and session data. Built for the teams behind every customer interaction.',
  primaryCTA: {
    text: 'Get Started',
    href: withUTM(SIGNUP_URL, buildUTM('role', 'roles-listing', 'cta-primary')),
  },
  secondaryCTA: {
    text: 'Talk to a Human',
    href: withUTM(TALLY_SALES_FORM_URL, buildUTM('role', 'roles-listing', 'cta-secondary')),
  },
};
