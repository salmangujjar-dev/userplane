import { SIGNUP_URL } from '../onboarding';
import { defineFramework } from './defaults';
import {
  DOCS_FRAMEWORK_ASTRO,
  DOCS_RECORDING_REQUESTING,
  DOCS_SDK_OVERVIEW,
  DOCS_SENSITIVE_DATA_REDACTION,
} from './links';
import { getFrameworkFeatureUrl, getFrameworkHeroUrl, getFrameworkIconUrl } from './media';

export const astroConfig = defineFramework({
  slug: 'astro',
  name: 'Astro',
  shortName: 'Astro',
  icon: { src: getFrameworkIconUrl('frameworks/astro.svg'), alt: 'Astro' },
  gradient: {
    stops: [
      'rgba(188, 82, 238, 0.1)',
      'rgba(170, 74, 215, 0.1)',
      'rgba(155, 68, 195, 0.1)',
      'rgba(188, 82, 238, 0.1)',
    ],
  },
  seo: {
    title: 'Userplane for Astro | Screen Recordings with Console Logs',
    description:
      'Every Astro recording ships with console logs, network data, and session activity captured across React, Vue, and Svelte islands.',
    keywords:
      'astro screen recording, astro session replay, astro console logs, astro debugging, astro islands screen recording, userplane astro',
  },
  hero: {
    headline: {
      lines: ['Fix Astro support issues', 'with screen recordings'],
      highlights: [{ wordIndex: 1, color: 'purple' }],
      icons: [
        {
          wordIndex: 1,
          src: getFrameworkIconUrl('frameworks/astro.svg'),
          alt: 'Astro',
        },
      ],
    },
    description: [
      'Logs, errors, and network data from every framework island.',
      'Captures across React, Vue, and Svelte islands.',
    ],
    preview: {
      src: getFrameworkHeroUrl('microsites/frameworks/astro/hero.png'),
      alt: 'Userplane screen recording from an Astro application',
    },
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_ASTRO },
  },
  features: [
    {
      number: '01',
      title: 'Session recordings, any island',
      description:
        'Customers record from a link. You get a full replay — interactions across every framework island on the page captured in a single recording.',
      tagline: 'One recording, all islands',
      capabilities: [
        'Cross-island recording',
        'Full session replay',
        'React, Vue, Svelte support',
        'No browser extensions',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/astro/astro-recording-link.png'),
      learnMoreHref: DOCS_FRAMEWORK_ASTRO,
    },
    {
      number: '02',
      title: 'Errors and network captured',
      description:
        'Console errors, network activity, browser metadata, and user actions — captured regardless of which framework island generated them.',
      tagline: 'Cross-island diagnostics',
      capabilities: [
        'Errors, warnings, and logs',
        'Network activity capture',
        'Environment and device metadata',
        'Island-agnostic capture',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/astro/astro-console-logs.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Redaction built in',
      description:
        'Sensitive data is masked before recordings leave the browser. SSR middleware handles token preservation through Astro redirects. GDPR and CCPA compliant.',
      tagline: 'Private across every island',
      capabilities: [
        'Client-side data masking',
        'SSR middleware support',
        'Token preservation',
        'GDPR and CCPA compliant',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/astro/astro-data-redaction.png'),
      learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
    },
    {
      number: '04',
      title: 'Routes to your support stack',
      description:
        'Recordings attach to Intercom, Zendesk, and Slack. Session data routes to tickets automatically. API and webhook integration for custom pipelines.',
      tagline: 'Where your team triages',
      capabilities: [
        'Intercom, Zendesk, Slack',
        'Attach recordings to tickets',
        'API and webhook integration',
        'Browser extension support',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/astro/astro-helpdesk-setup.png'),
      learnMoreHref: DOCS_SDK_OVERVIEW,
    },
  ],
  resources: {
    links: [
      {
        label: 'Guide',
        title: 'Astro Setup Guide',
        description:
          'Install Userplane in your Astro application. Client-side script blocks and SSR middleware.',
        href: DOCS_FRAMEWORK_ASTRO,
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
    seeAllHref: DOCS_FRAMEWORK_ASTRO,
  },
  cta: {
    headline: {
      lines: ['Troubleshoot Astro issues across every island'],
      highlights: [
        { wordIndex: 1, color: 'purple' },
        { wordIndex: 2, color: 'purple' },
      ],
    },
    description:
      'Island rendering issues, hydration bugs, and runtime errors — diagnosed with full technical context from every recording.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_ASTRO },
  },
});
