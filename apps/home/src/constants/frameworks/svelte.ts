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
    title: 'Userplane for Svelte | Screen Recordings with Console Logs',
    description:
      'Debug SvelteKit bugs from the recording. Get console logs, network, and session context across server hooks and routes.',
    keywords:
      'svelte screen recording, sveltekit session replay, svelte console logs, svelte debugging, sveltekit screen recording, server hooks session replay, userplane svelte',
  },
  hero: {
    headline: {
      lines: ['Resolve Svelte issues', 'with screen recordings'],
      highlights: [{ wordIndex: 1, color: 'red' }],
      icons: [
        {
          wordIndex: 1,
          src: getFrameworkIconUrl('frameworks/svelte.svg'),
          alt: 'Svelte',
        },
      ],
    },
    description: [
      'Full session context with console logs and network requests.',
      'Compatible with SvelteKit routing and server hooks.',
    ],
    preview: {
      src: getFrameworkHeroUrl('microsites/frameworks/svelte/hero.png'),
      alt: 'Userplane screen recording from a Svelte application',
    },
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_SVELTE },
  },
  features: [
    {
      number: '01',
      title: 'Instant screen recordings',
      description:
        'Customers click a link and record. You get a full replay of their SvelteKit session — every page load, transition, and runtime error. No extensions needed.',
      tagline: 'Replay every session',
      capabilities: [
        'Instant recording links',
        'Full SvelteKit session replay',
        'No browser extensions',
        'Works with SvelteKit routing',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/svelte/svelte-recording-link.png'),
      learnMoreHref: DOCS_FRAMEWORK_SVELTE,
    },
    {
      number: '02',
      title: 'Logs and network activity',
      description:
        'Console errors, network details, and browser metadata captured automatically. Debug server-rendered pages and client-side interactions in one recording.',
      tagline: 'SSR and CSR in one view',
      capabilities: [
        'Console errors and stack traces',
        'Network request details',
        'Browser and OS context',
        'SSR and CSR debugging',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/svelte/svelte-console-logs.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Data stays redacted',
      description:
        'Sensitive fields are masked before recordings leave the browser. Server hooks handle token preservation through SvelteKit redirects. GDPR and CCPA ready.',
      tagline: 'Masked before it ships',
      capabilities: [
        'In-browser data redaction',
        'Server hook token handling',
        'GDPR & CCPA covered',
        'SvelteKit redirect support',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/svelte/svelte-data-redaction.png'),
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
        'Sessions attached to tickets',
        'API and webhook endpoints',
        'Custom routing pipelines',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/svelte/svelte-helpdesk-setup.png'),
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
          'Script tag or npm. Pass user metadata, control recording state, and configure redaction.',
        href: DOCS_SDK_OVERVIEW,
      },
      {
        label: 'Recording',
        title: 'How Screen Recording Works',
        description:
          'How recordings collect console errors, network data, and session activity automatically.',
        href: DOCS_RECORDING_REQUESTING,
      },
    ],
    seeAllHref: DOCS_FRAMEWORK_SVELTE,
  },
  cta: {
    headline: {
      lines: ['Trace Svelte bugs to root cause in minutes'],
      highlights: [
        { wordIndex: 1, color: 'red' },
        { wordIndex: 2, color: 'red' },
      ],
    },
    description:
      'Runtime errors, SSR issues, and client-side bugs — resolved with console logs, network data, and full session context.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_SVELTE },
  },
});
