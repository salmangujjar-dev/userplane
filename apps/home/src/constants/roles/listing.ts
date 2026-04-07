import type { ButtonConfig, GradientConfig, IntegrationHeadline } from '@/types/roles';

import { TALLY_SALES_FORM_URL } from '../contact';
import { SIGNUP_URL } from '../onboarding';
import { getRoleHeroUrl } from './media';

// ── SEO ──

export const LISTING_SEO = {
  title: 'Userplane for Your Team | Screen Recordings with Full Technical Context',
  description:
    'Screen recordings with console logs, network data, and session metadata. Built for support agents, support engineers, customer success, and developers.',
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
      { wordIndex: 2, color: 'blue' },
      { wordIndex: 3, color: 'blue' },
    ],
  },
  description: [
    'Screen recordings with console logs, network data, and session metadata.',
    'See how Userplane works for your role.',
  ],
  primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
  secondaryCTA: { text: 'Talk to a Human', href: TALLY_SALES_FORM_URL },
  preview: {
    src: getRoleHeroUrl('microsites/support-agents/hero.png'),
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
    lines: ['Screen recordings with', 'full technical context'],
    highlights: [
      { wordIndex: 0, color: 'blue' },
      { wordIndex: 1, color: 'blue' },
    ],
  },
  description:
    'Console logs, network data, and session metadata — captured with every recording. Built for your entire team.',
  primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
  secondaryCTA: { text: 'Talk to a Human', href: TALLY_SALES_FORM_URL },
};
