import { SIGNUP_URL } from '../onboarding';
import { defineFramework } from './defaults';
import {
  DOCS_FRAMEWORK_REACT,
  DOCS_RECORDING_REQUESTING,
  DOCS_SDK_OVERVIEW,
  DOCS_SENSITIVE_DATA_REDACTION,
} from './links';
import { getFrameworkFeatureUrl, getFrameworkHeroUrl, getFrameworkIconUrl } from './media';

export const reactConfig = defineFramework({
  slug: 'react',
  name: 'React',
  icon: { src: getFrameworkIconUrl('frameworks/react.svg'), alt: 'React' },
  gradient: {
    stops: [
      'rgba(97, 218, 251, 0.1)',
      'rgba(88, 196, 220, 0.1)',
      'rgba(75, 170, 200, 0.1)',
      'rgba(97, 218, 251, 0.1)',
    ],
  },
  seo: {
    title: 'Userplane for React | Session Recordings with Console Logs',
    description:
      'Console logs, network waterfalls, and session metadata — captured from your React app. Works with Vite, CRA, and custom setups.',
    keywords:
      'react screen recording, react session replay, react console logs, react debugging, vite screen recording, userplane react',
  },
  hero: {
    headline: {
      lines: ['Screen recordings for', 'React applications'],
      highlights: [{ wordIndex: 3, color: 'blue' }],
      icons: [
        {
          wordIndex: 3,
          src: getFrameworkIconUrl('frameworks/react.svg'),
          alt: 'React',
        },
      ],
    },
    description: [
      'Console logs, network waterfalls, and session metadata — captured from your React app.',
      'Works with Vite, CRA, and custom setups.',
    ],
    preview: {
      src: getFrameworkHeroUrl('microsites/react/hero.png'),
      alt: 'Userplane screen recording from a React application',
    },
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_REACT },
  },
  features: [
    {
      number: '01',
      title: 'One-click session capture',
      description:
        'Customers click a link and record. You get a full replay with every component render, navigation event, and runtime error. No installs on their end.',
      tagline: 'No installs, full replay',
      capabilities: [
        'One-click recording links',
        'Full session replay',
        'No browser extensions',
        'Works with any React setup',
      ],
      image: getFrameworkFeatureUrl('microsites/react/react-sdk.png'),
      learnMoreHref: DOCS_FRAMEWORK_REACT,
    },
    {
      number: '02',
      title: 'Console and network context',
      description:
        'Errors, request waterfalls, browser metadata, and user action trails — captured automatically with every recording from your React application.',
      tagline: 'Full stack visibility',
      capabilities: [
        'Console logs and error traces',
        'Network request waterfall',
        'Browser & OS metadata',
        'User action trail',
      ],
      image: getFrameworkFeatureUrl('microsites/react/react-context.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Built-in data redaction',
      description:
        'Sensitive fields are masked client-side before recordings reach your team. SDK-level redaction rules and consent flow controls. GDPR and CCPA compliant.',
      tagline: 'Compliant from day one',
      capabilities: [
        'Client-side PII masking',
        'SDK-level redaction rules',
        'Consent flow controls',
        'GDPR & CCPA compliant',
      ],
      image: getFrameworkFeatureUrl('microsites/react/react-privacy.png'),
      learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
    },
    {
      number: '04',
      title: 'Routes to your support tools',
      description:
        'Session recordings flow to Intercom, Zendesk, or Slack. Link recordings to support tickets. API and webhooks for custom pipelines.',
      tagline: 'Context where you triage',
      capabilities: [
        'Intercom, Zendesk, Slack',
        'Link to support tickets',
        'API and webhook access',
        'Custom pipeline support',
      ],
      image: getFrameworkFeatureUrl('microsites/react/react-integration.png'),
      learnMoreHref: DOCS_SDK_OVERVIEW,
    },
  ],
  resources: {
    links: [
      {
        label: 'Guide',
        title: 'React Setup Guide',
        description:
          'Install Userplane in your React application. Provider component and useEffect initialization.',
        href: DOCS_FRAMEWORK_REACT,
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
    seeAllHref: DOCS_FRAMEWORK_REACT,
  },
  cta: {
    headline: {
      lines: ['Start capturing sessions', 'in your React app'],
      highlights: [
        { wordIndex: 1, color: 'blue' },
        { wordIndex: 2, color: 'blue' },
      ],
    },
    description:
      'Console logs, network waterfalls, and session metadata — captured from every React session.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_REACT },
  },
});
