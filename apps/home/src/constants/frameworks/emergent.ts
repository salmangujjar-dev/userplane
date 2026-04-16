import { SIGNUP_URL } from '../onboarding';
import { defineFramework } from './defaults';
import {
  DOCS_FRAMEWORK_EMERGENT,
  DOCS_RECORDING_REQUESTING,
  DOCS_SDK_OVERVIEW,
  DOCS_SENSITIVE_DATA_REDACTION,
} from './links';
import { getFrameworkFeatureUrl, getFrameworkHeroUrl, getFrameworkIconUrl } from './media';

export const emergentConfig = defineFramework({
  slug: 'emergent',
  name: 'Emergent',
  icon: { src: getFrameworkIconUrl('frameworks/emergent.svg'), alt: 'Emergent' },
  gradient: {
    stops: [
      'rgba(99, 102, 241, 0.1)',
      'rgba(89, 92, 217, 0.1)',
      'rgba(79, 82, 195, 0.1)',
      'rgba(99, 102, 241, 0.1)',
    ],
  },
  seo: {
    title: 'Userplane for Emergent | Screen Recordings for AI-Generated Apps',
    description:
      'Fix bugs from Emergent-built apps. Get console logs, network data, and session activity with every recording',
    keywords:
      'emergent screen recording, emergent session replay, ai generated app debugging, emergent console logs, vibe coding screen recording, userplane emergent',
  },
  hero: {
    headline: {
      lines: ['Resolve customer issues', 'with screen recordings'],
      highlights: [
        { wordIndex: 1, color: 'purple' },
        { wordIndex: 2, color: 'purple' },
      ],
      icons: [],
    },
    description: [
      'Request screen recordings from your Emergent apps.',
      'Console logs, network data, and errors captured automatically.',
    ],
    preview: {
      src: getFrameworkHeroUrl('microsites/frameworks/emergent/hero.png'),
      alt: 'Userplane screen recording from an Emergent application',
    },
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_EMERGENT },
  },
  features: [
    {
      number: '01',
      title: 'Prompt-driven installation',
      description:
        'Install Userplane with a single prompt. Start capturing recordings with logs and context instantly — no additional setup required.',
      tagline: 'AI handles the setup',
      capabilities: [
        'Conversational setup',
        'No manual code changes',
        'Full session replay',
        'Works with generated apps',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/emergent/emergent-recording-link.png'),
      learnMoreHref: DOCS_FRAMEWORK_EMERGENT,
    },
    {
      number: '02',
      title: 'Full technical context',
      description:
        'See logs, network, and user steps for every issue—so your team can resolve in-app support requests faster.',
      tagline: 'Debug generated code',
      capabilities: [
        'Console errors and stack traces',
        'Network activity capture',
        'Browser and OS context',
        'Step-by-step user actions',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/emergent/emergent-console-logs.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Privacy controls included',
      description:
        'Sensitive data is redacted before recordings leave the browser. Configure redaction rules via prompt. GDPR and CCPA compliant out of the box.',
      tagline: 'Compliant by default',
      capabilities: [
        'In-browser data redaction',
        'Prompt-configured privacy',
        'GDPR & CCPA covered',
        'Configurable consent flows',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/emergent/emergent-data-redaction.png'),
      learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
    },
    {
      number: '04',
      title: 'Integrates with your stack',
      description:
        'Recordings route to Intercom, Zendesk, and Slack. Session data attaches to tickets. API and webhook endpoints for custom routing.',
      tagline: 'Fits your support workflow',
      capabilities: [
        'Intercom, Zendesk, Slack',
        'Sessions attached to tickets',
        'API and webhook endpoints',
        'Chrome extension support',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/emergent/emergent-helpdesk-setup.png'),
      learnMoreHref: DOCS_SDK_OVERVIEW,
    },
  ],
  resources: {
    links: [
      {
        label: 'Guide',
        title: 'Emergent Setup Guide',
        description:
          'Install Userplane in your Emergent app. Describe the integration — the AI handles the rest.',
        href: DOCS_FRAMEWORK_EMERGENT,
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
    seeAllHref: DOCS_FRAMEWORK_EMERGENT,
  },
  cta: {
    headline: {
      lines: ['Debug Emergent app issues with full session activity'],
      highlights: [
        { wordIndex: 1, color: 'purple' },
        { wordIndex: 2, color: 'purple' },
      ],
    },
    description:
      'AI-generated code, production-grade debugging. Every recording includes console errors, network data, and complete session context.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_EMERGENT },
  },
});
