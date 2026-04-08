import { SIGNUP_URL } from '../onboarding';
import { defineFramework } from './defaults';
import {
  DOCS_FRAMEWORK_NEXTJS,
  DOCS_RECORDING_REQUESTING,
  DOCS_SDK_OVERVIEW,
  DOCS_SENSITIVE_DATA_REDACTION,
} from './links';
import { getFrameworkFeatureUrl, getFrameworkHeroUrl, getFrameworkIconUrl } from './media';

export const nextjsConfig = defineFramework({
  slug: 'nextjs',
  name: 'Next.js',
  icon: { src: getFrameworkIconUrl('frameworks/nextjs.svg'), alt: 'Next.js' },
  gradient: {
    stops: [
      'rgba(0, 0, 0, 0.08)',
      'rgba(17, 17, 17, 0.08)',
      'rgba(34, 34, 34, 0.08)',
      'rgba(51, 51, 51, 0.08)',
    ],
  },
  seo: {
    title: 'Userplane for Next.js | Screen Recordings with Console Logs',
    description:
      'Capture console logs, network requests, and session details from your Next.js app. Works with App Router and Server Components.',
    keywords:
      'next.js screen recording, nextjs session replay, nextjs console logs, next.js debugging, app router screen recording, userplane nextjs',
  },
  hero: {
    headline: {
      lines: ['Fix Next.js support issues', 'with session recordings'],
      highlights: [{ wordIndex: 1, color: 'blue' }],
      icons: [
        {
          wordIndex: 1,
          src: getFrameworkIconUrl('frameworks/nextjs.svg'),
          alt: 'Next.js',
        },
      ],
    },
    description: [
      'Every recording ships with console logs, errors, and network data.',
      'Works with App Router and Server Components.',
    ],
    preview: {
      src: getFrameworkHeroUrl('microsites/frameworks/nextjs/hero.png'),
      alt: 'Userplane screen recording from a Next.js application',
    },
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_NEXTJS },
  },
  features: [
    {
      number: '01',
      title: 'Record customer sessions',
      description:
        "Send a recording link. Get back a full session replay from the customer's Next.js app — every click, navigation, and error captured. No browser extension needed.",
      tagline: 'One link, full replay',
      capabilities: [
        'One-click recording links',
        'Full session replay',
        'No browser extensions',
        'Works with App Router',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/nextjs/nextjs-recording-link.png'),
      learnMoreHref: DOCS_FRAMEWORK_NEXTJS,
    },
    {
      number: '02',
      title: 'Logs, network, and metadata',
      description:
        'Console errors, network request details, and browser fingerprints ship with every recording. Debug client-side hydration issues and API failures without asking for steps to reproduce.',
      tagline: 'Debug without the back-and-forth',
      capabilities: [
        'Console logs and error traces',
        'Network request overview',
        'Browser & OS metadata',
        'Step-by-step user actions',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/nextjs/nextjs-console-logs.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Redaction before capture',
      description:
        'PII is masked before recordings leave the browser. GDPR and CCPA compliant. Middleware-compatible token handling for App Router redirects.',
      tagline: 'Private by default',
      capabilities: [
        'Client-side PII masking',
        'GDPR & CCPA compliant',
        'Middleware token handling',
        'Configurable redaction rules',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/nextjs/nextjs-data-redaction.png'),
      learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
    },
    {
      number: '04',
      title: 'Plugs into your help desk',
      description:
        'Recordings attach to Intercom, Zendesk, and Slack conversations. Link session details to tickets. API and webhook access for custom routing.',
      tagline: 'Deliver context where tickets live',
      capabilities: [
        'Intercom, Zendesk, Slack',
        'Recordings linked to tickets',
        'API and webhook access',
        'Chrome extension included',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/nextjs/nextjs-helpdesk-setup.png'),
      learnMoreHref: DOCS_SDK_OVERVIEW,
    },
  ],
  resources: {
    links: [
      {
        label: 'Guide',
        title: 'Next.js Setup Guide',
        description:
          'Install Userplane in your Next.js App Router application. Dynamic import, provider component, and middleware setup.',
        href: DOCS_FRAMEWORK_NEXTJS,
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
    seeAllHref: DOCS_FRAMEWORK_NEXTJS,
  },
  cta: {
    headline: {
      lines: ['Debug Next.js issues with full session context'],
      highlights: [
        { wordIndex: 1, color: 'blue' },
        { wordIndex: 2, color: 'blue' },
      ],
    },
    description:
      'Hydration errors, API failures, and client-side bugs — diagnosed with console logs, network data, and full session context.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_NEXTJS },
  },
});
