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
    title: 'Userplane for React | Screen Recordings with Console Logs',
    description:
      'Every React recording ships with console logs, network activity, and session context. Works with Vite, CRA, and custom setups.',
    keywords:
      'react screen recording, react session replay, react console logs, react debugging, vite screen recording, userplane react',
  },
  hero: {
    headline: {
      lines: ['Debug React issues', 'with screen recordings'],
      highlights: [{ wordIndex: 1, color: 'green' }],
      icons: [
        {
          wordIndex: 1,
          src: getFrameworkIconUrl('frameworks/react.svg'),
          alt: 'React',
        },
      ],
    },
    description: [
      'Replay the user recordings with logs, errors, and network data.',
      'Works with Vite, CRA, and custom setups.',
    ],
    preview: {
      src: getFrameworkHeroUrl('microsites/frameworks/react/hero.png'),
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
      image: getFrameworkFeatureUrl('microsites/frameworks/react/react-recording-link.png'),
      learnMoreHref: DOCS_FRAMEWORK_REACT,
    },
    {
      number: '02',
      title: 'Console and network context',
      description:
        'Errors, request details, browser metadata, and user action trails — captured automatically with every recording from your React application.',
      tagline: 'Full stack visibility',
      capabilities: [
        'Console errors and stack traces',
        'Network request snapshots',
        'Browser and OS context',
        'User action trail',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/react/react-console-logs.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Built-in data redaction',
      description:
        'Sensitive fields are masked client-side before recordings reach your team. SDK-level redaction rules and consent flow controls. GDPR and CCPA compliant.',
      tagline: 'Compliant from day one',
      capabilities: [
        'In-browser data redaction',
        'SDK-level redaction rules',
        'Consent flow controls',
        'GDPR & CCPA covered',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/react/react-data-redaction.png'),
      learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
    },
    {
      number: '04',
      title: 'Routes to your support tools',
      description:
        'Screen recordings flow to Intercom, Zendesk, or Slack. Link recordings to support tickets. API and webhooks for custom pipelines.',
      tagline: 'Context where you triage',
      capabilities: [
        'Intercom, Zendesk, Slack',
        'Sessions attached to tickets',
        'API and webhook endpoints',
        'Custom pipeline support',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/react/react-helpdesk-setup.png'),
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
    seeAllHref: DOCS_FRAMEWORK_REACT,
  },
  cta: {
    headline: {
      lines: ['Resolve React issues without the back-and-forth'],
      highlights: [
        { wordIndex: 1, color: 'blue' },
        { wordIndex: 2, color: 'blue' },
      ],
    },
    description:
      'Stop chasing customers for repro steps. Every recording includes the console logs, network data, and context your team needs.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_REACT },
  },
});
