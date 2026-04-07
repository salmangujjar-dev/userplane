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

export const developersConfig = defineRole({
  slug: 'developers',
  name: 'Developers',
  shortName: 'Developers',
  gradient: {
    stops: [
      'rgba(139, 92, 246, 0.1)',
      'rgba(124, 58, 237, 0.1)',
      'rgba(109, 40, 217, 0.1)',
      'rgba(147, 51, 234, 0.1)',
    ],
  },
  seo: {
    title: 'Userplane for Developers | Session Data Captured Automatically',
    description:
      'Console logs, network waterfalls, and session metadata — captured with every recording. Drop-in SDK for React, Next.js, Vue, Angular, and more.',
    keywords:
      'developer screen recording, session replay sdk, console logs sdk, react screen recording, next.js screen recording, vue screen recording, angular screen recording, userplane sdk',
  },
  hero: {
    headline: {
      lines: ['Session data captured', 'automatically'],
      highlights: [{ wordIndex: 0, color: 'purple' }],
    },
    description: [
      'Console logs, network waterfalls, and session metadata — captured with every recording.',
      'Drop-in SDK. Works with React, Next.js, Vue, Angular, and more.',
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
        "Every recording captures errors, network waterfalls, browser metadata, and user steps. The data you'd normally ask support to collect — attached automatically.",
      tagline: 'Zero-config session data',
      capabilities: [
        'Console logs and error traces',
        'Network request waterfall',
        'Browser & OS metadata',
        'Step-by-step user actions',
      ],
      image: getRoleFeatureUrl('microsites/developers/dev-console.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '02',
      title: 'Drop-in SDK, every framework',
      description:
        'React, Next.js, Vue, Angular, Svelte. npm install or script tag. Capturing sessions in minutes.',
      tagline: 'Works with your stack',
      capabilities: ['React & Next.js', 'Vue & Nuxt', 'Angular', 'Svelte & vanilla JS'],
      image: getRoleFeatureUrl('microsites/developers/dev-frameworks.png'),
      learnMoreHref: DOCS_DEVELOPER_INSTALLATION,
    },
    {
      number: '03',
      title: 'Context in your existing tools',
      description:
        'Recordings link to support conversations. Session data routes to Slack, Jira, and Linear. API and webhook access included.',
      tagline: 'Fits where you already work',
      capabilities: [
        'Slack, Jira, Linear integrations',
        'Deep-link to support conversations',
        'API access',
        'Webhook support',
      ],
      image: getRoleFeatureUrl('microsites/developers/dev-workflow.png'),
      learnMoreHref: DOCS_DEVELOPER_INSTALLATION,
    },
    {
      number: '04',
      title: 'Privacy controls in code',
      description:
        'Define redaction rules, consent flows, and capture scope in your codebase. GDPR and CCPA compliance built into the SDK.',
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
      lines: ['Start capturing sessions', 'in under 5 minutes'],
      highlights: [
        { wordIndex: 1, color: 'purple' },
        { wordIndex: 2, color: 'purple' },
      ],
    },
    description:
      'Drop-in SDK. Console logs, network data, and session metadata — captured with every recording.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FOR_DEVELOPERS },
  },
});
