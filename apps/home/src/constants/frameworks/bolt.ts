import { SIGNUP_URL } from '../onboarding';
import { defineFramework } from './defaults';
import {
  DOCS_FRAMEWORK_BOLT,
  DOCS_RECORDING_REQUESTING,
  DOCS_SDK_OVERVIEW,
  DOCS_SENSITIVE_DATA_REDACTION,
} from './links';
import { getFrameworkFeatureUrl, getFrameworkHeroUrl, getFrameworkIconUrl } from './media';

export const boltConfig = defineFramework({
  slug: 'bolt',
  name: 'Bolt',
  icon: { src: getFrameworkIconUrl('frameworks/bolt.svg'), alt: 'Bolt' },
  gradient: {
    stops: [
      'rgba(255, 196, 0, 0.1)',
      'rgba(230, 176, 0, 0.1)',
      'rgba(204, 157, 0, 0.1)',
      'rgba(255, 196, 0, 0.1)',
    ],
  },
  seo: {
    title: 'Userplane for Bolt | Screen Recordings for Bolt.new Apps',
    description:
      'Fix bugs from your Bolt-built apps. Request recordings with console logs, network data, and session activity.',
    keywords:
      'bolt screen recording, bolt.new session replay, bolt console logs, ai builder screen recording, bolt debugging, userplane bolt',
  },
  hero: {
    headline: {
      lines: ['Resolve support tickets', 'with screen recordings'],
      highlights: [
        { wordIndex: 1, color: 'yellow' },
        { wordIndex: 2, color: 'yellow' },
      ],
      icons: [],
    },
    description: [
      'Add screen recordings to your Bolt.new app with a single prompt.',
      'Console logs, network data, and session data — no code editing required.',
    ],
    preview: {
      src: getFrameworkHeroUrl('microsites/frameworks/bolt/hero.png'),
      alt: 'Userplane screen recording from a Bolt.new application',
    },
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_BOLT },
  },
  features: [
    {
      number: '01',
      title: 'Paste a prompt, done',
      description:
        'Copy a prompt into Bolt and Userplane is installed. No manual code edits, no package installs. Customers record from a link — you get the full replay.',
      tagline: 'Prompt-driven setup',
      capabilities: [
        'One-prompt installation',
        'No manual code edits',
        'Full session replay',
        'Works with any Bolt app',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/bolt/bolt-recording-link.png'),
      learnMoreHref: DOCS_FRAMEWORK_BOLT,
    },
    {
      number: '02',
      title: 'Console and network context',
      description:
        'Every recording captures console errors, network requests, browser metadata, and user steps. Debug prompt-built apps with the same depth as hand-written code.',
      tagline: 'Full diagnostic context',
      capabilities: [
        'Console logs and error traces',
        'Network request snapshots',
        'Browser and device metadata',
        'User action trail',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/bolt/bolt-console-logs.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Built-in data redaction',
      description:
        'Sensitive fields are masked before recordings leave the browser. Add redaction rules via prompt — no manual configuration needed. GDPR and CCPA compliant.',
      tagline: 'Private from the start',
      capabilities: [
        'Client-side PII masking',
        'Prompt-driven redaction rules',
        'GDPR & CCPA compliant',
        'Consent flow controls',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/bolt/bolt-data-redaction.png'),
      learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
    },
    {
      number: '04',
      title: 'Routes to your support stack',
      description:
        'Recordings attach to Intercom, Zendesk, and Slack conversations. API and webhook access for custom routing.',
      tagline: 'Context where you triage',
      capabilities: [
        'Intercom, Zendesk, Slack',
        'Recordings linked to tickets',
        'API and webhook access',
        'Chrome extension included',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/bolt/bolt-helpdesk-setup.png'),
      learnMoreHref: DOCS_SDK_OVERVIEW,
    },
  ],
  resources: {
    links: [
      {
        label: 'Guide',
        title: 'Bolt Setup Guide',
        description:
          'Install Userplane in your Bolt.new app. Copy a prompt — no code editing needed.',
        href: DOCS_FRAMEWORK_BOLT,
      },
      {
        label: 'SDK',
        title: 'SDK Overview',
        description:
          'Embed script or npm package. Attach metadata, control recordings, and configure privacy.',
        href: DOCS_SDK_OVERVIEW,
      },
      {
        label: 'Recording',
        title: 'How Screen Recording Works',
        description:
          'How recordings capture console logs, network requests, and session details automatically.',
        href: DOCS_RECORDING_REQUESTING,
      },
    ],
    seeAllHref: DOCS_FRAMEWORK_BOLT,
  },
  cta: {
    headline: {
      lines: ['Capture Bolt app issues with complete recording context'],
      highlights: [
        { wordIndex: 1, color: 'yellow' },
        { wordIndex: 2, color: 'yellow' },
      ],
    },
    description:
      'Prompt-built apps deserve production-grade debugging. Every recording ships with console logs, network data, and full session context.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_BOLT },
  },
});
