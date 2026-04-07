import { SIGNUP_URL } from '../onboarding';
import { defineFramework } from './defaults';
import {
  DOCS_FRAMEWORK_SVELTE,
  DOCS_RECORDING_REQUESTING,
  DOCS_SDK_OVERVIEW,
  DOCS_SENSITIVE_DATA_REDACTION,
} from './links';
import { getFrameworkFeatureUrl, getFrameworkHeroUrl, getFrameworkIconUrl } from './media';

export const svelteConfig = defineFramework({
  slug: 'svelte',
  name: 'Svelte',
  icon: { src: getFrameworkIconUrl('frameworks/svelte.svg'), alt: 'Svelte' },
  gradient: {
    stops: [
      'rgba(255, 62, 0, 0.1)',
      'rgba(230, 56, 0, 0.1)',
      'rgba(204, 50, 0, 0.1)',
      'rgba(255, 62, 0, 0.1)',
    ],
  },
  seo: {
    title: 'Userplane for Svelte | Session Recordings with Console Logs',
    description:
      'Capture console logs, network requests, and session metadata from your Svelte app. Compatible with SvelteKit routing and server hooks.',
    keywords:
      'svelte screen recording, sveltekit session replay, svelte console logs, svelte debugging, sveltekit screen recording, server hooks session replay, userplane svelte',
  },
  hero: {
    headline: {
      lines: ['Screen recordings for', 'Svelte applications'],
      highlights: [{ wordIndex: 3, color: 'yellow' }],
      icons: [
        {
          wordIndex: 3,
          src: getFrameworkIconUrl('frameworks/svelte.svg'),
          alt: 'Svelte',
        },
      ],
    },
    description: [
      'Capture console logs, network requests, and session metadata from your Svelte app.',
      'Compatible with SvelteKit routing and server hooks.',
    ],
    preview: {
      src: getFrameworkHeroUrl('microsites/svelte/hero.png'),
      alt: 'Userplane screen recording from a Svelte application',
    },
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_SVELTE },
  },
  features: [
    {
      number: '01',
      title: 'Instant session recordings',
      description:
        'Customers click a link and record. You get a full replay of their SvelteKit session — every page load, transition, and runtime error. No extensions needed.',
      tagline: 'Replay every session',
      capabilities: [
        'Instant recording links',
        'Full SvelteKit session replay',
        'No browser extensions',
        'Works with SvelteKit routing',
      ],
      image: getFrameworkFeatureUrl('microsites/svelte/svelte-sdk.png'),
      learnMoreHref: DOCS_FRAMEWORK_SVELTE,
    },
    {
      number: '02',
      title: 'Logs and network activity',
      description:
        'Console errors, network waterfalls, and browser metadata captured automatically. Debug server-rendered pages and client-side interactions in one recording.',
      tagline: 'SSR and CSR in one view',
      capabilities: [
        'Console logs and error traces',
        'Network request waterfall',
        'Browser & OS metadata',
        'SSR and CSR debugging',
      ],
      image: getFrameworkFeatureUrl('microsites/svelte/svelte-context.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Data stays redacted',
      description:
        'Sensitive fields are masked before recordings leave the browser. Server hooks handle token preservation through SvelteKit redirects. GDPR and CCPA ready.',
      tagline: 'Masked before it ships',
      capabilities: [
        'Client-side field masking',
        'Server hook token handling',
        'GDPR & CCPA ready',
        'SvelteKit redirect support',
      ],
      image: getFrameworkFeatureUrl('microsites/svelte/svelte-privacy.png'),
      learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
    },
    {
      number: '04',
      title: 'Connects to support tools',
      description:
        'Recordings attach to Intercom, Zendesk, and Slack. Link session data to tickets. API and webhook support for custom routing.',
      tagline: 'Support context, delivered',
      capabilities: [
        'Intercom, Zendesk, Slack',
        'Session data linked to tickets',
        'API and webhook support',
        'Custom routing pipelines',
      ],
      image: getFrameworkFeatureUrl('microsites/svelte/svelte-integration.png'),
      learnMoreHref: DOCS_SDK_OVERVIEW,
    },
  ],
  resources: {
    links: [
      {
        label: 'Guide',
        title: 'Svelte Setup Guide',
        description:
          'Install Userplane in your SvelteKit application. onMount initialization and server hooks setup.',
        href: DOCS_FRAMEWORK_SVELTE,
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
          'How recordings capture console logs, network requests, and session metadata automatically.',
        href: DOCS_RECORDING_REQUESTING,
      },
    ],
    seeAllHref: DOCS_FRAMEWORK_SVELTE,
  },
  cta: {
    headline: {
      lines: ['Start capturing sessions', 'in your Svelte app'],
      highlights: [
        { wordIndex: 1, color: 'yellow' },
        { wordIndex: 2, color: 'yellow' },
      ],
    },
    description:
      'Console logs, network requests, and session metadata — captured from every Svelte session.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_SVELTE },
  },
});
