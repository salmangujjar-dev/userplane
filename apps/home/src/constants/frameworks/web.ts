import { SIGNUP_URL } from '../onboarding';
import { defineFramework } from './defaults';
import {
  DOCS_FRAMEWORK_WEB,
  DOCS_RECORDING_REQUESTING,
  DOCS_SDK_OVERVIEW,
  DOCS_SENSITIVE_DATA_REDACTION,
} from './links';
import { getFrameworkFeatureUrl, getFrameworkHeroUrl, getFrameworkIconUrl } from './media';

export const webConfig = defineFramework({
  slug: 'web',
  name: 'Web',
  shortName: 'Web',
  icon: { src: getFrameworkIconUrl('frameworks/html5.svg'), alt: 'Web' },
  gradient: {
    stops: [
      'rgba(59, 130, 246, 0.1)',
      'rgba(53, 117, 222, 0.1)',
      'rgba(47, 105, 200, 0.1)',
      'rgba(59, 130, 246, 0.1)',
    ],
  },
  seo: {
    title: 'Userplane for Web | Screen Recordings with Console Logs',
    description:
      'Skip asking for the repro steps. One script tag delivers recordings with console logs, network data, and session activity.',
    keywords:
      'web screen recording, website session replay, html screen recording, javascript session replay, static site screen recording, userplane web',
  },
  hero: {
    headline: {
      lines: ['Fix user-reported issues', 'with screen recordings'],
      highlights: [{ wordIndex: 1, color: 'blue' }],
    },
    description: [
      'Capture console logs, network requests, and session activity from any app. One script tag. No frameworks needed.',
    ],
    preview: {
      src: getFrameworkHeroUrl('microsites/frameworks/web/hero.png'),
      alt: 'Userplane screen recording from a web application',
    },
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_WEB },
  },
  features: [
    {
      number: '01',
      title: 'Add a script tag, done',
      description:
        'One <script> tag and a <meta> tag in your HTML. No npm, no build step, no framework. Customers record from a link — you get the full replay.',
      tagline: 'Paste and ship',
      capabilities: [
        'Single script tag setup',
        'No build step required',
        'No framework dependency',
        'Full session replay',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/web/web-recording-link.png'),
      learnMoreHref: DOCS_FRAMEWORK_WEB,
    },
    {
      number: '02',
      title: 'Logs and network included',
      description:
        'Console errors, network request data, browser metadata, and user steps — attached to every recording. Works on any page that runs JavaScript.',
      tagline: 'Works everywhere',
      capabilities: [
        'Errors, warnings, and logs',
        'Network request log',
        'Environment and device metadata',
        'User action trail',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/web/web-console-logs.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Redaction via markup',
      description:
        'Add data-userplane-blur to any HTML element to redact it. Configure blur targets via meta tags. No code changes. GDPR and CCPA compliant.',
      tagline: 'Private by default',
      capabilities: [
        'Attribute-based redaction',
        'Meta tag configuration',
        'No code changes needed',
        'GDPR and CCPA compliant',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/web/web-data-redaction.png'),
      learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
    },
    {
      number: '04',
      title: 'Works with every help desk',
      description:
        'Recordings attach to Intercom, Zendesk, and Slack. Session data routes to tickets. API and webhook support for any custom integration.',
      tagline: 'Help desk agnostic',
      capabilities: [
        'Intercom, Zendesk, Slack',
        'Attach recordings to tickets',
        'API and webhook integration',
        'Custom integrations',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/web/web-helpdesk-setup.png'),
      learnMoreHref: DOCS_SDK_OVERVIEW,
    },
  ],
  resources: {
    links: [
      {
        label: 'Guide',
        title: 'Static HTML Setup Guide',
        description: 'Add Userplane to any website. One script tag, no build step.',
        href: DOCS_FRAMEWORK_WEB,
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
    seeAllHref: DOCS_FRAMEWORK_WEB,
  },
  cta: {
    headline: {
      lines: ['Fix customer issues without asking what happened'],
      highlights: [
        { wordIndex: 1, color: 'blue' },
        { wordIndex: 2, color: 'blue' },
      ],
    },
    description:
      'Console errors, network data, and user steps — everything your team needs to resolve issues on first contact.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_WEB },
  },
});
