import { SIGNUP_URL } from '../onboarding';
import { defineFramework } from './defaults';
import {
  DOCS_FRAMEWORK_NUXT,
  DOCS_RECORDING_REQUESTING,
  DOCS_SDK_OVERVIEW,
  DOCS_SENSITIVE_DATA_REDACTION,
} from './links';
import { getFrameworkFeatureUrl, getFrameworkHeroUrl, getFrameworkIconUrl } from './media';

export const nuxtConfig = defineFramework({
  slug: 'nuxt',
  name: 'Nuxt',
  icon: { src: getFrameworkIconUrl('frameworks/nuxt.svg'), alt: 'Nuxt' },
  gradient: {
    stops: [
      'rgba(0, 220, 130, 0.1)',
      'rgba(0, 200, 120, 0.1)',
      'rgba(0, 180, 110, 0.1)',
      'rgba(0, 220, 130, 0.1)',
    ],
  },
  seo: {
    title: 'Userplane for Nuxt | Screen Recordings with Console Logs',
    description:
      'Console logs, network requests, and session info from your Nuxt app. SSR-safe. Works with Nuxt 3 runtime config.',
    keywords:
      'nuxt screen recording, nuxt session replay, nuxt console logs, nuxt debugging, nuxt 3 screen recording, userplane nuxt',
  },
  hero: {
    headline: {
      lines: ['Debug Nuxt issues', 'with screen recordings'],
      highlights: [{ wordIndex: 1, color: 'green' }],
      icons: [
        {
          wordIndex: 1,
          src: getFrameworkIconUrl('frameworks/nuxt.svg'),
          alt: 'Nuxt',
        },
      ],
    },
    description: [
      'SSR and client-side sessions captured with full context.',
      'Works with Nuxt 3 runtime config.',
    ],
    preview: {
      src: getFrameworkHeroUrl('microsites/frameworks/nuxt/hero.png'),
      alt: 'Userplane screen recording from a Nuxt application',
    },
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_NUXT },
  },
  features: [
    {
      number: '01',
      title: 'On-demand session replays',
      description:
        'Send a link. Customers record. You get a full session replay — server-rendered pages, client navigations, and runtime errors all in one recording.',
      tagline: 'Capture what happened',
      capabilities: [
        'On-demand recording links',
        'Full session replay',
        'SSR page capture',
        'Client navigation tracking',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/nuxt/nuxt-recording-link.png'),
      learnMoreHref: DOCS_FRAMEWORK_NUXT,
    },
    {
      number: '02',
      title: 'Full diagnostic context',
      description:
        'Console errors, network request snapshots, browser metadata, and user steps — shipped with every recording. Works across server and client boundaries.',
      tagline: 'Diagnose across boundaries',
      capabilities: [
        'Console logs and error traces',
        'Network activity log',
        'Browser & OS metadata',
        'Server and client coverage',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/nuxt/nuxt-console-logs.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Privacy from the start',
      description:
        'PII is redacted client-side before recordings are transmitted. Browser-only initialization keeps your server bundle clean. GDPR and CCPA compliant.',
      tagline: 'Redacted, then transmitted',
      capabilities: [
        'Client-side PII redaction',
        'Browser-only initialization',
        'Server bundle safe',
        'GDPR & CCPA compliant',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/nuxt/nuxt-data-redaction.png'),
      learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
    },
    {
      number: '04',
      title: 'Pipes to your help desk',
      description:
        'Screen recordings route to Intercom, Zendesk, and Slack. Link recordings to support tickets. API and webhook endpoints for custom integrations.',
      tagline: 'Context lands where you work',
      capabilities: [
        'Intercom, Zendesk, Slack',
        'Recordings attached to tickets',
        'API and webhook endpoints',
        'Custom pipeline routing',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/nuxt/nuxt-helpdesk-setup.png'),
      learnMoreHref: DOCS_SDK_OVERVIEW,
    },
  ],
  resources: {
    links: [
      {
        label: 'Guide',
        title: 'Nuxt Setup Guide',
        description:
          'Install Userplane in your Nuxt 3 application. Browser-only client plugin and runtime config setup.',
        href: DOCS_FRAMEWORK_NUXT,
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
          'How recordings capture console logs, network requests, and session info automatically.',
        href: DOCS_RECORDING_REQUESTING,
      },
    ],
    seeAllHref: DOCS_FRAMEWORK_NUXT,
  },
  cta: {
    headline: {
      lines: ['Stop guessing what broke in your Nuxt app'],
      highlights: [
        { wordIndex: 1, color: 'green' },
        { wordIndex: 2, color: 'green' },
      ],
    },
    description:
      'SSR and client-side issues diagnosed with console errors, network activity, and complete browser context from every recording.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_NUXT },
  },
});
