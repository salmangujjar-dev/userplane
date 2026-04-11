import type {
  ButtonConfig,
  FeatureData,
  GradientConfig,
  IntegrationHeadline,
  ResourceLink,
} from '@/types/integrations';

import { TALLY_SALES_FORM_URL } from '../contact';
import {
  DOCS_DEVELOPER_INSTALLATION,
  DOCS_HELPDESK_SETUP,
  DOCS_HOME,
  DOCS_RECORDING_REQUESTING,
  DOCS_SENSITIVE_DATA_REDACTION,
} from '../integrations/links';
import { getLaunchFeatureUrl, getLaunchHeroUrl } from '../integrations/media';
import { SIGNUP_URL } from '../onboarding';

// ── SEO ──

export const LAUNCH_SEO = {
  title: 'Userplane — Screen Recordings for Customer Support',
  description:
    'Send a recording link. Get back a full replay with console logs, network requests, and session context. Built for support teams.',
  keywords:
    'screen recording, customer support, bug reporting, session replay, console logs, network requests, userplane, product hunt',
  ogImage: '/images/preview/og-launch.webp',
} as const;

// ── Gradient ──

export const LAUNCH_GRADIENT: GradientConfig = {
  stops: [
    'rgba(59, 130, 246, 0.1)',
    'rgba(16, 185, 129, 0.1)',
    'rgba(139, 92, 246, 0.1)',
    'rgba(236, 72, 153, 0.1)',
  ],
};

// ── Hero ──

export const LAUNCH_HERO: {
  headline: IntegrationHeadline;
  description: string[];
  primaryCTA: ButtonConfig;
  secondaryCTA: ButtonConfig;
  screenshot: { src: string; alt: string };
} = {
  headline: {
    lines: ['Resolve support issues', 'without the back-and-forth'],
    highlights: [
      { wordIndex: 1, color: 'blue' },
      { wordIndex: 2, color: 'blue' },
    ],
  },
  description: [
    'Send a link to your customer. Get back a complete replay with console logs, network requests, and session details.',
  ],
  primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
  secondaryCTA: { text: 'See Demo', href: '/demo' },
  screenshot: {
    src: getLaunchHeroUrl('launch/general/hero.png'),
    alt: 'Userplane screen recording dashboard',
  },
};

// ── Logos ──

export const LAUNCH_LOGOS_LABEL = 'Works with the tools you already use';

// ── Features ──

export const LAUNCH_FEATURES: FeatureData[] = [
  {
    number: '01',
    title: 'Recording, logs, and errors',
    description:
      'Share a recording link with your customer. Every recording includes the technical context behind the issue—logs, network activity, and user actions—so your team can quickly understand and resolve problems.',
    tagline: 'Everything in one replay',
    capabilities: [
      'Surface console logs & errors',
      'Capture network requests',
      'Access application state',
      'Follow timestamped user actions',
    ],
    image: getLaunchFeatureUrl('launch/general/general-context.png'),
    learnMoreHref: DOCS_RECORDING_REQUESTING,
  },
  {
    number: '02',
    title: 'Built into your help desk',
    description:
      'Userplane lives inside Slack, Intercom, and Zendesk. Request recordings from the conversation thread and receive replays without switching tabs. Your team stays where the conversation already lives.',
    tagline: 'Native integrations',
    capabilities: [
      'Slack slash commands & mentions',
      'Intercom Messenger app',
      'Zendesk sidebar app',
      'Chrome Extension for any tool',
    ],
    image: getLaunchFeatureUrl('launch/general/general-integration.png'),
    learnMoreHref: '/integrations',
  },
  {
    number: '03',
    title: 'Privacy-first by design',
    description:
      'Sensitive data is automatically blurred and redacted before recordings leave the browser. Your customers stay in control of what gets captured, and your team stays compliant without extra work.',
    tagline: 'Built for trust & compliance',
    capabilities: [
      'Automatic PII redaction',
      'Field-level blurring',
      'GDPR & CCPA compliant',
      'Customer consent controls',
    ],
    image: getLaunchFeatureUrl('launch/general/general-privacy.png'),
    learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
  },
];

// ── Resources ──

export const LAUNCH_RESOURCES: {
  label: string;
  headline: string;
  links: ResourceLink[];
  footerLinks: { text: string; href: string; external?: boolean }[];
} = {
  label: 'Resources',
  headline: 'Get started',
  links: [
    {
      label: 'Quickstart',
      title: 'Getting Started with Userplane',
      description:
        'Set up Userplane in your workspace and send your first recording request in minutes.',
      href: DOCS_HELPDESK_SETUP,
    },
    {
      label: 'Recording',
      title: 'How Screen Recording Works',
      description:
        'Learn how recordings capture console logs, network requests, and session metadata automatically.',
      href: DOCS_RECORDING_REQUESTING,
    },
    {
      label: 'Developer',
      title: 'Developer Installation Guide',
      description:
        'Technical guide for installing the Userplane SDK and configuring it for your application.',
      href: DOCS_DEVELOPER_INSTALLATION,
    },
  ],
  footerLinks: [
    { text: 'View all integrations', href: '/integrations' },
    { text: 'See all docs', href: DOCS_HOME, external: true },
  ],
};

// ── Listing Badges ──

export const LAUNCH_LISTING_BADGES = [
  {
    name: 'Twelve Tools',
    href: 'https://twelve.tools',
    badge: {
      src: 'https://twelve.tools/badge0-white.svg',
      alt: 'Featured on Twelve Tools',
      width: 200,
      height: 54,
    },
  },
];

// ── CTA ──

export const LAUNCH_CTA: {
  headline: IntegrationHeadline;
  description: string;
  primaryCTA: ButtonConfig;
  secondaryCTA: ButtonConfig;
} = {
  headline: {
    lines: ['Resolve issues faster', 'with complete context upfront'],
    highlights: [
      { wordIndex: 1, color: 'blue' },
      { wordIndex: 2, color: 'blue' },
      { wordIndex: 5, color: 'green' },
      { wordIndex: 6, color: 'green' },
    ],
  },
  description:
    'Send a link and get back a complete replay with logs, network data, and session details.',
  primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
  secondaryCTA: { text: 'Talk to a Human', href: TALLY_SALES_FORM_URL },
};
