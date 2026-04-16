import { SIGNUP_URL } from '../onboarding';
import { defineFramework } from './defaults';
import {
  DOCS_FRAMEWORK_SOLIDJS,
  DOCS_RECORDING_REQUESTING,
  DOCS_SDK_OVERVIEW,
  DOCS_SENSITIVE_DATA_REDACTION,
} from './links';
import { getFrameworkFeatureUrl, getFrameworkHeroUrl, getFrameworkIconUrl } from './media';

export const solidjsConfig = defineFramework({
  slug: 'solidjs',
  name: 'SolidJS',
  icon: { src: getFrameworkIconUrl('frameworks/solidjs.svg'), alt: 'SolidJS' },
  gradient: {
    stops: [
      'rgba(68, 107, 222, 0.1)',
      'rgba(61, 96, 200, 0.1)',
      'rgba(54, 86, 178, 0.1)',
      'rgba(68, 107, 222, 0.1)',
    ],
  },
  seo: {
    title: 'Userplane for SolidJS | Screen Recordings with Console Logs',
    description:
      'Resolve support issues with screen recordings. Every recording carries console logs, network data, and session context.',
    keywords:
      'solidjs screen recording, solid session replay, solidjs console logs, solidjs debugging, solidstart screen recording, signals session replay, userplane solidjs',
  },
  hero: {
    headline: {
      lines: ['Resolve SolidJS issues', 'with screen recordings'],
      highlights: [{ wordIndex: 1, color: 'blue' }],
      icons: [
        {
          wordIndex: 1,
          src: getFrameworkIconUrl('frameworks/solidjs.svg'),
          alt: 'SolidJS',
        },
      ],
    },
    description: [
      'Console logs, network data, and user actions from every render.',
      'Works with SolidStart SSR and Vite-based setups.',
    ],
    preview: {
      src: getFrameworkHeroUrl('microsites/frameworks/solidjs/hero.png'),
      alt: 'Userplane screen recording from a SolidJS application',
    },
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_SOLIDJS },
  },
  features: [
    {
      number: '01',
      title: 'CDN or npm — your call',
      description:
        'Add a script tag for instant setup, or install the npm package for programmatic control. SolidStart apps use dynamic imports to keep the server bundle clean.',
      tagline: 'Flexible installation',
      capabilities: [
        'CDN script tag setup',
        'npm SDK with onMount',
        'SolidStart SSR safe',
        'Full session replay',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/solidjs/solidjs-recording-link.png'),
      learnMoreHref: DOCS_FRAMEWORK_SOLIDJS,
    },
    {
      number: '02',
      title: 'Signals and network captured',
      description:
        'Console errors, network requests, browser metadata, and user actions — captured from every SolidJS render. Debug reactive state issues with full session context.',
      tagline: 'Reactive state visibility',
      capabilities: [
        'Errors, warnings, and logs',
        'Network request timeline',
        'Environment and device metadata',
        'User action trail',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/solidjs/solidjs-console-logs.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Privacy-first recording',
      description:
        'Sensitive data is masked before recordings leave the browser. Works with SolidStart middleware. GDPR and CCPA compliant out of the box.',
      tagline: 'Redacted before capture',
      capabilities: [
        'Client-side data masking',
        'SolidStart middleware support',
        'GDPR and CCPA compliant',
        'Configurable redaction rules',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/solidjs/solidjs-data-redaction.png'),
      learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
    },
    {
      number: '04',
      title: 'Works with your support tools',
      description:
        'Recordings attach to Intercom, Zendesk, and Slack conversations. Session data links to tickets. API and webhook support for custom workflows.',
      tagline: 'Fits where you triage',
      capabilities: [
        'Intercom, Zendesk, Slack',
        'Attach recordings to tickets',
        'API and webhook integration',
        'Flexible pipeline support',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/solidjs/solidjs-helpdesk-setup.png'),
      learnMoreHref: DOCS_SDK_OVERVIEW,
    },
  ],
  resources: {
    links: [
      {
        label: 'Guide',
        title: 'SolidJS Setup Guide',
        description:
          'Install Userplane in your SolidJS application. Provider component and onMount initialization.',
        href: DOCS_FRAMEWORK_SOLIDJS,
      },
      {
        label: 'SDK',
        title: 'SDK Overview',
        description:
          'One script tag or npm install. Attach metadata, trigger recordings, and mask sensitive fields.',
        href: DOCS_SDK_OVERVIEW,
      },
      {
        label: 'Recording',
        title: 'How Screen Recording Works',
        description:
          'How recordings capture errors, network traffic, and session behavior automatically.',
        href: DOCS_RECORDING_REQUESTING,
      },
    ],
    seeAllHref: DOCS_FRAMEWORK_SOLIDJS,
  },
  cta: {
    headline: {
      lines: ['Identify SolidJS issues with screen recordings'],
      highlights: [
        { wordIndex: 1, color: 'blue' },
        { wordIndex: 2, color: 'blue' },
      ],
    },
    description:
      'Reactive state issues, SSR hydration bugs, and runtime errors — every recording has the technical context to find the root cause.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_SOLIDJS },
  },
});
