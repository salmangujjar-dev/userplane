import { SIGNUP_URL } from '../onboarding';
import { defineRole } from './defaults';
import {
  DOCS_DEVELOPER_INSTALLATION,
  DOCS_FOR_DEVELOPERS,
  DOCS_RECORDING_REQUESTING,
  DOCS_SENSITIVE_DATA_REDACTION,
} from './links';
import { ROLE_LOGOS_FRAMEWORK, ROLE_LOGOS_FRAMEWORK_LABEL } from './logos';
import { getRoleFeatureUrl, getRoleHeroUrl } from './media';

export const engineeringConfig = defineRole({
  slug: 'engineering',
  name: 'Engineering Teams',
  shortName: 'Engineering Teams',
  gradient: {
    stops: [
      'rgba(139, 92, 246, 0.1)',
      'rgba(124, 58, 237, 0.1)',
      'rgba(109, 40, 217, 0.1)',
      'rgba(147, 51, 234, 0.1)',
    ],
  },
  seo: {
    title: 'Userplane for Engineering Teams | Debug Customer Issues with Full Session Context',
    description:
      'Screen recordings with console logs, network data, and session metadata. Engineering teams get full reproduction context without the back and forth with support. Drop-in SDK for React, Next.js, Vue, Angular, and more.',
    keywords:
      'engineering screen recording, session replay sdk, console logs sdk, react screen recording, next.js screen recording, vue screen recording, angular screen recording, userplane sdk',
  },
  hero: {
    headline: {
      lines: ['Debug customer issues', 'with full session context'],
      highlights: [
        { wordIndex: 1, color: 'purple' },
        { wordIndex: 2, color: 'purple' },
      ],
    },
    description: [
      'Console logs, network activity, and session metadata — captured with every recording.',
      'Works with React, Next.js, Vue, Angular, and more.',
    ],
    preview: {
      src: getRoleHeroUrl('microsites/developers/hero.png'),
      alt: 'Userplane SDK capturing session data with console logs and network requests',
    },
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FOR_DEVELOPERS },
  },
  logos: {
    label: ROLE_LOGOS_FRAMEWORK_LABEL,
    items: ROLE_LOGOS_FRAMEWORK,
  },
  features: [
    {
      number: '01',
      title: 'Console logs and network data',
      description:
        'Debug customer-reported issues with full context — without chasing support for more detail. Every recording captures errors, network snapshots, browser metadata, and user steps.',
      tagline: 'Zero-config session data',
      capabilities: [
        'Capture console logs and errors',
        'Get network request snapshots',
        'Complete session replay',
        'Step-by-step user actions',
      ],
      image: getRoleFeatureUrl('microsites/developers/dev-console.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '02',
      title: 'Drop-in SDK',
      description:
        'First-class support for React, Next.js, Vue, Angular and more. Install the SDK and get complete session context for every customer-reported bug.',
      tagline: 'Works with your stack',
      capabilities: ['React & Next.js', 'Vue & Nuxt', 'Angular', 'Svelte & vanilla JS'],
      image: getRoleFeatureUrl('microsites/developers/dev-frameworks.png'),
      learnMoreHref: DOCS_DEVELOPER_INSTALLATION,
    },
    {
      number: '03',
      title: 'Native to your support stack',
      description:
        'Every recording lives alongside the support conversation — deep-linked to the ticket in Intercom or Zendesk, routed to your issue tracker, and accessible from Slack. Full context, right where your team expects it.',
      tagline: 'Fits where you already work',
      capabilities: [
        'Embedded into Intercom',
        'Available inside Zendesk tickets',
        'Request recordings from Slack',
        'Chrome extension included',
      ],
      image: getRoleFeatureUrl('microsites/developers/dev-workflow.png'),
      learnMoreHref: DOCS_DEVELOPER_INSTALLATION,
    },
    {
      number: '04',
      title: 'Privacy controls in code',
      description:
        'Define redaction rules, consent flows, and capture scope in your codebase. Control exactly what gets captured, what gets redacted, and how consent is handled.',
      tagline: 'Compliance as code',
      capabilities: [
        'SDK-level redaction rules',
        'Programmatic consent flows',
        'Field-level capture control',
        'GDPR & CCPA built in',
      ],
      image: getRoleFeatureUrl('microsites/developers/dev-privacy.png'),
      learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
    },
  ],
  resources: {
    links: [
      {
        label: 'Getting Started',
        title: 'Developer Onboarding',
        description:
          'Install the SDK, configure metadata, set up domain verification, and control what gets captured.',
        href: DOCS_FOR_DEVELOPERS,
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
    seeAllHref: DOCS_FOR_DEVELOPERS,
  },
  cta: {
    headline: {
      lines: ['Fix customer issues without back-and-forth'],
      highlights: [
        { wordIndex: 1, color: 'purple' },
        { wordIndex: 2, color: 'purple' },
      ],
    },
    description:
      'Investigate issues with console logs, network data, and session data — captured with every recording.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FOR_DEVELOPERS },
  },
});
