import { SIGNUP_URL } from '../onboarding';
import { defineFramework } from './defaults';
import {
  DOCS_FRAMEWORK_LOVABLE,
  DOCS_RECORDING_REQUESTING,
  DOCS_SDK_OVERVIEW,
  DOCS_SENSITIVE_DATA_REDACTION,
} from './links';
import { getFrameworkFeatureUrl, getFrameworkHeroUrl, getFrameworkIconUrl } from './media';

export const lovableConfig = defineFramework({
  slug: 'lovable',
  name: 'Lovable',
  icon: { src: getFrameworkIconUrl('frameworks/lovable.svg'), alt: 'Lovable' },
  gradient: {
    stops: [
      'rgba(236, 72, 153, 0.1)',
      'rgba(213, 65, 138, 0.1)',
      'rgba(190, 58, 123, 0.1)',
      'rgba(236, 72, 153, 0.1)',
    ],
  },
  seo: {
    title: 'Userplane for Lovable | Screen Recordings for Lovable Apps',
    description:
      'Every Lovable recording comes with console logs, network data, session activity and more',
    keywords:
      'lovable screen recording, lovable session replay, lovable console logs, lovable debugging, ai app builder screen recording, userplane lovable',
  },
  hero: {
    headline: {
      lines: ['Resolve support issues', 'with screen recordings'],
      highlights: [{ wordIndex: 1, color: 'red' }],
      icons: [
        {
          wordIndex: 1,
          position: 'after',
          src: getFrameworkIconUrl('frameworks/lovable.svg'),
          alt: 'Lovable',
        },
      ],
    },
    description: [
      'One prompt to add recordings to your deployed Lovable app.',
      'Console logs, network data, and session details from every build.',
    ],
    preview: {
      src: getFrameworkHeroUrl('microsites/frameworks/lovable/hero.png'),
      alt: 'Userplane screen recording from a Lovable application',
    },
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_LOVABLE },
  },
  features: [
    {
      number: '01',
      title: 'One prompt to install',
      description:
        'Copy the setup prompt into Lovable. The recording script is added to your deployed app automatically. Works with every Lovable deploy pipeline.',
      tagline: 'Ships with your deploys',
      capabilities: [
        'Single-prompt setup',
        'Automatic deploy integration',
        'Full session replay',
        'No manual code changes',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/lovable/lovable-recording-link.png'),
      learnMoreHref: DOCS_FRAMEWORK_LOVABLE,
    },
    {
      number: '02',
      title: 'Errors, network, and steps',
      description:
        'Console errors, network data, browser metadata, and step-by-step user actions — captured from every deployed Lovable app. Debug production issues without reproducing them.',
      tagline: 'Production-grade visibility',
      capabilities: [
        'Console output and error logs',
        'Network request log',
        'Device and browser details',
        'Step-by-step user actions',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/lovable/lovable-console-logs.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Data stays private',
      description:
        'Sensitive fields are masked client-side before recordings are transmitted. Configure blur targets via prompt. GDPR and CCPA compliant.',
      tagline: 'Masked before capture',
      capabilities: [
        'Client-side field masking',
        'Prompt-configured blur targets',
        'GDPR & CCPA ready',
        'Customer consent controls',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/lovable/lovable-data-redaction.png'),
      learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
    },
    {
      number: '04',
      title: 'Delivers to your help desk',
      description:
        'Recordings attach to Intercom, Zendesk, and Slack. Session data links to tickets. API and webhook access for custom integrations.',
      tagline: 'Support context, delivered',
      capabilities: [
        'Intercom, Zendesk, Slack',
        'Ticket-linked session data',
        'API and webhook support',
        'Custom workflow support',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/lovable/lovable-helpdesk-setup.png'),
      learnMoreHref: DOCS_SDK_OVERVIEW,
    },
  ],
  resources: {
    links: [
      {
        label: 'Guide',
        title: 'Lovable Setup Guide',
        description: 'Install Userplane in your Lovable app. Copy a prompt and deploy.',
        href: DOCS_FRAMEWORK_LOVABLE,
      },
      {
        label: 'SDK',
        title: 'SDK Overview',
        description:
          'CDN script or npm package. Identify users, manage sessions, and apply privacy settings.',
        href: DOCS_SDK_OVERVIEW,
      },
      {
        label: 'Recording',
        title: 'How Screen Recording Works',
        description:
          'How recordings gather console output, network requests, and session interactions automatically.',
        href: DOCS_RECORDING_REQUESTING,
      },
    ],
    seeAllHref: DOCS_FRAMEWORK_LOVABLE,
  },
  cta: {
    headline: {
      lines: ['Resolve Lovable app issues without chasing repro steps'],
      highlights: [
        { wordIndex: 1, color: 'red' },
        { wordIndex: 2, color: 'red' },
      ],
    },
    description:
      'Deployed Lovable apps get full debugging context. Every recording includes console errors, network data, and complete user session details.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_LOVABLE },
  },
});
