import { TALLY_SALES_FORM_URL } from '../contact';
import { SIGNUP_URL } from '../onboarding';
import { defineRole } from './defaults';
import {
  DOCS_FOR_SUPPORT_AGENTS,
  DOCS_HELPDESK_SETUP,
  DOCS_RECORDING_REQUESTING,
  DOCS_SENSITIVE_DATA_REDACTION,
} from './links';
import { getRoleFeatureUrl, getRoleHeroUrl } from './media';

export const supportAgentsConfig = defineRole({
  slug: 'support-agents',
  name: 'Support Agents',
  shortName: 'Agents',
  gradient: {
    stops: [
      'rgba(245, 158, 11, 0.1)',
      'rgba(251, 146, 60, 0.1)',
      'rgba(234, 88, 12, 0.1)',
      'rgba(249, 115, 22, 0.1)',
    ],
  },
  seo: {
    title: 'Userplane for Support Agents | See What Went Wrong, Resolve It Faster',
    description:
      'Request screen recordings with console logs, network data, and user steps directly from your help desk. Uncover root cause and resolve tickets on the first reply.',
    keywords:
      'support agent tools, screen recording support, help desk screen recording, intercom screen recording, zendesk screen recording, resolve tickets faster, userplane',
  },
  hero: {
    headline: {
      lines: ['Uncover root cause', 'not just symptoms'],
      highlights: [
        { wordIndex: 1, color: 'yellow' },
        { wordIndex: 2, color: 'yellow' },
      ],
    },
    description: [
      'Screen recordings with console logs, network data, and user steps.',
      'See what went wrong and resolve it on the first reply.',
    ],
    preview: {
      src: getRoleHeroUrl('microsites/support-agents/hero.png'),
      alt: 'Userplane screen recording with full technical context',
    },
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'Talk to a Human', href: TALLY_SALES_FORM_URL },
  },
  features: [
    {
      number: '01',
      title: 'One-click recording links',
      description:
        'Send recording links from Intercom, Zendesk, or Slack. No apps, no installs, no extensions. Customers click, record, done.',
      tagline: 'Straight from the inbox',
      capabilities: [
        'One-click recording links',
        'Works from Intercom, Zendesk, Slack',
        'No installs for customers',
        'Recordings linked to the conversation',
      ],
      image: getRoleFeatureUrl('microsites/support-agents/agent-recording.png'),
      learnMoreHref: DOCS_HELPDESK_SETUP,
    },
    {
      number: '02',
      title: 'Full technical context',
      description:
        'Every recording includes console errors, network requests, browser metadata, and a step-by-step action trail. Attached automatically.',
      tagline: 'Everything you need to triage',
      capabilities: [
        'Console logs and error traces',
        'Network request waterfall',
        'Step-by-step user actions',
        'Browser and device metadata',
      ],
      image: getRoleFeatureUrl('microsites/support-agents/agent-context.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Built for your help desk',
      description:
        'Request and review recordings from the sidebar, shortcuts, and macros — without leaving Intercom, Zendesk, or Slack.',
      tagline: 'Works where you already work',
      capabilities: [
        'Native Intercom sidebar app',
        'Zendesk ticket integration',
        'Slack recording requests',
        'Macros and shortcut support',
      ],
      image: getRoleFeatureUrl('microsites/support-agents/agent-recording.png'),
      learnMoreHref: DOCS_HELPDESK_SETUP,
    },
    {
      number: '04',
      title: 'Private by default',
      description:
        'Sensitive fields are redacted before recordings leave the browser. GDPR and CCPA compliant. Role-based access included.',
      tagline: 'Compliant out of the box',
      capabilities: [
        'Automatic PII redaction',
        'Field-level blurring',
        'GDPR & CCPA compliant',
        'Customer consent controls',
      ],
      image: getRoleFeatureUrl('microsites/support-agents/agent-privacy.png'),
      learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
    },
  ],
  resources: {
    links: [
      {
        label: 'Getting Started',
        title: 'Support Agent Onboarding',
        description:
          'Start collecting screen recordings from customers and reviewing sessions inside your help desk.',
        href: DOCS_FOR_SUPPORT_AGENTS,
      },
      {
        label: 'Recording',
        title: 'How Screen Recording Works',
        description:
          'Learn how recordings capture console logs, network requests, and session metadata automatically.',
        href: DOCS_RECORDING_REQUESTING,
      },
      {
        label: 'Quickstart',
        title: 'Help Desk Setup',
        description:
          'Connect Userplane to your help desk and send your first recording request in minutes.',
        href: DOCS_HELPDESK_SETUP,
      },
    ],
    seeAllHref: DOCS_FOR_SUPPORT_AGENTS,
  },
  cta: {
    headline: {
      lines: ['See the issue clearly', 'resolve it on the first reply'],
      highlights: [
        { wordIndex: 1, color: 'yellow' },
        { wordIndex: 2, color: 'yellow' },
      ],
    },
    description:
      'Request screen recordings and get back a complete replay with console logs, network data, and session details.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'Talk to a Human', href: TALLY_SALES_FORM_URL },
  },
});
