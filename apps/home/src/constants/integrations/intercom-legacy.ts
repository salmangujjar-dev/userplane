import { mergeTransformOptions } from '@userplane/storage/media';

import type {
  ButtonConfig,
  FeatureData,
  GradientConfig,
  IntegrationHeadline,
  ResourceLink,
} from '@/types/integrations';

import { mediaClient } from '../../lib/media';
import { TALLY_SALES_FORM_URL } from '../contact';
import { SIGNUP_URL } from '../onboarding';
import { getDocsUrl } from '../urls';

// ── Gradient ──

export const INTERCOM_GRADIENT: GradientConfig = {
  stops: [
    'rgba(0, 122, 255, 0.2)',
    'rgba(40, 110, 250, 0.2)',
    'rgba(59, 80, 246, 0.2)',
    'rgba(0, 142, 255, 0.2)',
  ],
};

// ── Hero ──

export const INTERCOM_HERO: {
  headline: IntegrationHeadline;
  description: string;
  primaryCTA: ButtonConfig;
  secondaryCTA: ButtonConfig;
  preview: { src: string; alt: string };
} = {
  headline: {
    lines: ['Screen recordings that', 'live inside'],
    accent: 'Intercom',
  },
  description:
    'Userplane is the screen recording layer for support teams. Request, capture, and replay customer issues.',
  primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
  secondaryCTA: { text: 'See Demo', href: '/demo' },
  preview: {
    src: mediaClient.getMicrositeMediaUrl('microsites/intercom/hero.png', {
      transform: mergeTransformOptions('feature', { width: 1440 }),
    }),
    alt: 'Intercom integration preview',
  },
};

// ── Features ──

export const INTERCOM_FEATURES: FeatureData[] = [
  {
    number: '01',
    title: 'Native Intercom messenger app',
    description:
      'Userplane lives inside the Intercom Messenger. Your team can request recordings without switching tabs or copying links. The entire workflow happens where your conversations already live.',
    tagline: 'Seamless integration',
    capabilities: [
      'One-click recording requests',
      'Inline recording playback',
      'Conversation-linked recordings',
      'No context switching',
    ],
    image: mediaClient.getMicrositeMediaUrl('microsites/intercom/feat-01.png', {
      transform: mergeTransformOptions('feature', { width: 864 }),
    }),
  },
  {
    number: '02',
    title: 'Automatic technical context',
    description:
      'Every recording automatically captures console logs, network requests, browser metadata, and user steps. Your engineering team gets the data they need without asking for it.',
    tagline: 'Full-stack visibility',
    capabilities: [
      'Console logs & errors',
      'Network request waterfall',
      'Browser & OS metadata',
      'Step-by-step user actions',
    ],
    image: mediaClient.getMicrositeMediaUrl('microsites/intercom/feat-02.png', {
      transform: mergeTransformOptions('feature', { width: 864 }),
    }),
  },
  {
    number: '03',
    title: 'Privacy-first recording',
    description:
      'Sensitive data is automatically blurred and redacted before recordings reach your team. Built-in compliance controls ensure customer trust while giving your team complete visibility.',
    tagline: 'Built for trust & compliance',
    capabilities: [
      'Automatic PII redaction',
      'Field-level blurring',
      'GDPR & CCPA compliant',
      'Customer consent controls',
    ],
    image: mediaClient.getMicrositeMediaUrl('microsites/intercom/feat-03.png', {
      transform: mergeTransformOptions('feature', { width: 864 }),
    }),
  },
];

// ── Resources ──

export const INTERCOM_RESOURCES: {
  label: string;
  headline: string;
  links: ResourceLink[];
  seeAllHref: string;
} = {
  label: 'Resources',
  headline: 'The Latest',
  links: [
    {
      label: 'Quickstart',
      title: 'Getting Started with Intercom',
      description:
        'Set up Userplane in your Intercom workspace and send your first recording request in minutes.',
      href: getDocsUrl('/getting-started/helpdesk-setup'),
    },
    {
      label: 'Recording',
      title: 'How Screen Recording Works',
      description:
        'Learn how recordings capture console logs, network requests, and session metadata automatically.',
      href: getDocsUrl('/recording/requesting'),
    },
    {
      label: 'Developer',
      title: 'Developer Installation Guide',
      description:
        'Technical guide for installing the Userplane SDK and configuring it for your application.',
      href: getDocsUrl('/developer/installation'),
    },
  ],
  seeAllHref: getDocsUrl(''),
};

// ── CTA ──

export const INTERCOM_CTA: {
  headline: IntegrationHeadline;
  primaryCTA: ButtonConfig;
  secondaryCTA: ButtonConfig;
} = {
  headline: {
    lines: ['Screen recordings that', 'live inside'],
    accent: 'Intercom',
  },
  primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
  secondaryCTA: { text: 'Talk to a Human', href: TALLY_SALES_FORM_URL },
};
