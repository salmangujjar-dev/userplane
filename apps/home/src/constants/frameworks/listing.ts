import type { ButtonConfig, GradientConfig, IntegrationHeadline } from '@/types/frameworks';

import { SIGNUP_URL } from '../onboarding';
import { buildUTM, withUTM } from '../utm';
import { getFrameworkHeroUrl } from './media';

// ── Gradient ──

export const LISTING_GRADIENT: GradientConfig = {
  stops: [
    'rgba(97, 218, 251, 0.1)',
    'rgba(79, 192, 141, 0.1)',
    'rgba(188, 82, 238, 0.1)',
    'rgba(255, 62, 0, 0.1)',
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
    lines: ['Screen recordings that', 'work with your stack'],
    highlights: [
      { wordIndex: 5, color: 'blue' },
      { wordIndex: 6, color: 'blue' },
    ],
  },
  description: [
    'Capture console logs, network data, and session details from any app. Drop-in SDK for Next.js, React, Vue, and more.',
  ],
  primaryCTA: {
    text: 'Get Started',
    href: withUTM(SIGNUP_URL, buildUTM('framework', 'frameworks-listing', 'hero-primary')),
  },
  secondaryCTA: {
    text: 'View Docs',
    href: withUTM(
      'https://docs.userplane.io/developer/sdk-overview',
      buildUTM('framework', 'frameworks-listing', 'hero-secondary')
    ),
  },
  preview: {
    src: getFrameworkHeroUrl('microsites/frameworks/nextjs/hero.png'),
    alt: 'Userplane SDK working across frameworks',
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
    lines: ['Resolve customer issues from any framework'],
    highlights: [
      { wordIndex: 1, color: 'blue' },
      { wordIndex: 2, color: 'blue' },
    ],
  },
  description:
    'Debug issues across any framework with console logs, network data, and complete session context.',
  primaryCTA: {
    text: 'Get Started',
    href: withUTM(SIGNUP_URL, buildUTM('framework', 'frameworks-listing', 'cta-primary')),
  },
  secondaryCTA: {
    text: 'View Docs',
    href: withUTM(
      'https://docs.userplane.io/developer/sdk-overview',
      buildUTM('framework', 'frameworks-listing', 'cta-secondary')
    ),
  },
};
