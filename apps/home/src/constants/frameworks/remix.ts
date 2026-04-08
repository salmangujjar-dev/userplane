import { SIGNUP_URL } from '../onboarding';
import { defineFramework } from './defaults';
import {
  DOCS_FRAMEWORK_REMIX,
  DOCS_RECORDING_REQUESTING,
  DOCS_SDK_OVERVIEW,
  DOCS_SENSITIVE_DATA_REDACTION,
} from './links';
import { getFrameworkFeatureUrl, getFrameworkHeroUrl, getFrameworkIconUrl } from './media';

export const remixConfig = defineFramework({
  slug: 'remix',
  name: 'Remix',
  icon: { src: getFrameworkIconUrl('frameworks/remix.svg'), alt: 'Remix' },
  gradient: {
    stops: [
      'rgba(57, 146, 255, 0.1)',
      'rgba(51, 131, 230, 0.1)',
      'rgba(46, 118, 207, 0.1)',
      'rgba(57, 146, 255, 0.1)',
    ],
  },
  seo: {
    title: 'Userplane for Remix | Session Recordings with Console Logs',
    description:
      'Capture console logs, network requests, and session data from your Remix app. Works with loaders, actions, and nested routes.',
    keywords:
      'remix screen recording, remix session replay, remix console logs, remix debugging, remix loaders screen recording, nested routes session replay, userplane remix',
  },
  hero: {
    headline: {
      lines: ['Diagnose Remix issues', 'with session recordings'],
      highlights: [{ wordIndex: 1, color: 'blue' }],
      icons: [
        {
          wordIndex: 1,
          src: getFrameworkIconUrl('frameworks/remix.svg'),
          alt: 'Remix',
        },
      ],
    },
    description: [
      'Console logs, network data, and user actions across every route.',
      'Works with loaders, actions, and nested layouts.',
    ],
    preview: {
      src: getFrameworkHeroUrl('microsites/frameworks/remix/hero.png'),
      alt: 'Userplane screen recording from a Remix application',
    },
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_REMIX },
  },
  features: [
    {
      number: '01',
      title: 'CDN or npm — drop it in',
      description:
        'Add a script tag to your root route for instant setup, or install the npm package for programmatic control. Remix apps use a useEffect in the root to keep server bundles clean.',
      tagline: 'Setup in minutes',
      capabilities: [
        'CDN script tag setup',
        'npm SDK with useEffect',
        'Root route initialization',
        'Full session replay',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/remix/remix-recording-link.png'),
      learnMoreHref: DOCS_FRAMEWORK_REMIX,
    },
    {
      number: '02',
      title: 'Loaders, actions, and logs captured',
      description:
        'Console errors, network requests, browser metadata, and user actions — captured across nested routes. Debug loader failures and form submission errors with full session context.',
      tagline: 'Full route visibility',
      capabilities: [
        'Console logs and error traces',
        'Network request timeline',
        'Browser & OS metadata',
        'User action trail',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/remix/remix-console-logs.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Privacy built into the pipeline',
      description:
        'Sensitive data is masked before recordings leave the browser. Works alongside Remix middleware and loader-level access control. GDPR and CCPA compliant out of the box.',
      tagline: 'Redacted before capture',
      capabilities: [
        'Client-side PII masking',
        'Loader-aware redaction',
        'GDPR & CCPA compliant',
        'Configurable redaction rules',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/remix/remix-data-redaction.png'),
      learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
    },
    {
      number: '04',
      title: 'Plugs into your support stack',
      description:
        'Recordings attach to Intercom, Zendesk, and Slack conversations. Session data links directly to tickets. API and webhook support for custom routing.',
      tagline: 'Fits where you triage',
      capabilities: [
        'Intercom, Zendesk, Slack',
        'Attach sessions to tickets',
        'API and webhook support',
        'Custom pipeline routing',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/remix/remix-helpdesk-setup.png'),
      learnMoreHref: DOCS_SDK_OVERVIEW,
    },
  ],
  resources: {
    links: [
      {
        label: 'Guide',
        title: 'Remix Setup Guide',
        description:
          'Install Userplane in your Remix application. Root route provider and useEffect initialization.',
        href: DOCS_FRAMEWORK_REMIX,
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
          'How recordings capture console logs, network requests, and session data automatically.',
        href: DOCS_RECORDING_REQUESTING,
      },
    ],
    seeAllHref: DOCS_FRAMEWORK_REMIX,
  },
  cta: {
    headline: {
      lines: ['Trace Remix bugs from loader to render'],
      highlights: [
        { wordIndex: 1, color: 'blue' },
        { wordIndex: 2, color: 'blue' },
      ],
    },
    description:
      'Loader failures, action errors, and route transitions — every recording includes the technical context to find the root cause.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_REMIX },
  },
});
