import type { ButtonConfig, GradientConfig, IntegrationHeadline } from '@/types/frameworks';

import { SIGNUP_URL } from '../onboarding';
import { getFrameworkHeroUrl } from './media';

// ── SEO ──

export const LISTING_SEO = {
  title: 'Userplane for Your Framework | Screen Recordings with Console Logs',
  description:
    'Capture console logs, network requests, and session metadata from Next.js, React, Vue, Angular, Svelte, Nuxt, Astro, and any web application.',
  keywords:
    'screen recording sdk, session replay frameworks, nextjs screen recording, react session replay, vue screen recording, angular debugging, svelte session capture, userplane',
} as const;

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
      { wordIndex: 4, color: 'blue' },
      { wordIndex: 5, color: 'blue' },
    ],
  },
  description: [
    'Console logs, network requests, and session metadata — captured from any framework.',
    'Drop-in SDK for Next.js, React, Vue, Angular, Svelte, Nuxt, Astro, and more.',
  ],
  primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
  secondaryCTA: { text: 'View Docs', href: 'https://docs.userplane.io/developer/sdk-overview' },
  preview: {
    src: getFrameworkHeroUrl('microsites/nextjs/hero.png'),
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
    lines: ['Session data captured', 'from any framework'],
    highlights: [
      { wordIndex: 0, color: 'blue' },
      { wordIndex: 1, color: 'blue' },
    ],
  },
  description:
    'Console logs, network waterfalls, and session metadata — captured with every recording. Works with your stack.',
  primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
  secondaryCTA: { text: 'View Docs', href: 'https://docs.userplane.io/developer/sdk-overview' },
};
