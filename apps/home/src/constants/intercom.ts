import { TALLY_SALES_FORM_URL } from './contact';
import type {
  ButtonConfig,
  ComplianceBadge,
  FeatureData,
  GradientConfig,
  IntegrationHeadline,
  ResourceLink,
  StepData,
  StepsHeadline,
} from './integrations';
import { SIGNUP_URL } from './onboarding';
import { getDocsUrl } from './urls';

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
    src: 'https://placehold.co/1440x800/f8f8f8/cccccc?text=Intercom+Integration',
    alt: 'Intercom integration preview',
  },
};

// ── Steps ──

export const INTERCOM_STEPS: {
  headline: StepsHeadline;
  steps: StepData[];
} = {
  headline: {
    before: 'Userplane',
    segments: [
      { accent: 'captures', after: 'what your customer sees,' },
      { accent: 'attaches', after: 'technical context, and delivers' },
      { accent: 'resolution', after: 'without the back and forth.' },
    ],
  },
  steps: [
    {
      number: '01',
      title: 'Send a recording request from Intercom',
      description:
        'With one click from your Intercom conversation, send a recording link to your customer. No installs or browser extensions needed.',
      image: 'https://placehold.co/400x220/f8f8f8/cccccc?text=Step+01',
    },
    {
      number: '02',
      title: 'Customer records what went wrong',
      description:
        'Your customer clicks the link and records their screen. Console logs, network requests, and session metadata are captured automatically.',
      image: 'https://placehold.co/400x220/f8f8f8/cccccc?text=Step+02',
    },
    {
      number: '03',
      title: 'Replay with complete context',
      description:
        'The recording appears right in your Intercom conversation with console errors, network waterfall, and browser metadata attached.',
      image: 'https://placehold.co/400x220/f8f8f8/cccccc?text=Step+03',
    },
  ],
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
    image: 'https://placehold.co/864x540/f8f8f8/cccccc?text=Native+Intercom+messenger+app',
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
    image: 'https://placehold.co/864x540/f8f8f8/cccccc?text=Automatic+technical+context',
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
    image: 'https://placehold.co/864x540/f8f8f8/cccccc?text=Privacy-first+recording',
  },
];

// ── Compliance ──

export const INTERCOM_COMPLIANCE: {
  label: string;
  headline: { bold: string; muted: string };
  badges: ComplianceBadge[];
} = {
  label: 'Security',
  headline: {
    bold: 'Secure by design.',
    muted: 'Safe by default.',
  },
  badges: [
    {
      title: 'GDPR',
      description:
        'Fully compliant with GDPR. Customer data is processed and stored in accordance with EU data protection regulations.',
      icon: 'gdpr',
    },
    {
      title: 'CCPA',
      description:
        'Compliant with the California Consumer Privacy Act. Users retain full control over their personal information.',
      icon: 'ccpa',
    },
  ],
};

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
