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
    title: 'Userplane for Support Agents | Understand Customer Issues on First Contact',
    description:
      'Close support tickets on first contact. Every recording lands with console logs, network data, and exact user steps.',
    keywords:
      'support agent tools, screen recording support, help desk screen recording, intercom screen recording, zendesk screen recording, resolve tickets faster, userplane',
  },
  hero: {
    headline: {
      lines: ['Get complete visibility', 'into customer issues'],
      highlights: [
        { wordIndex: 1, color: 'yellow' },
        { wordIndex: 2, color: 'yellow' },
      ],
    },
    description: [
      'Request screen recordings with console logs, network data, and user steps.',
      'See exactly what went wrong and resolve it on the first contact.',
    ],
    preview: {
      src: getRoleHeroUrl('microsites/roles/support-agents/hero.png'),
      alt: 'Userplane screen recording with full technical context',
    },
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'Talk to a Human', href: TALLY_SALES_FORM_URL },
  },
  features: [
    {
      number: '01',
      title: 'Know exactly what went wrong',
      description:
        'See the exact steps that led to the issue. Every click, scroll, and moment leading up to the problem. Get the full sequence — from first action to point of failure, delivered to you.',
      tagline: 'See the issue, not a description of it',
      capabilities: [
        'Capture every click and interaction',
        'Follow step-by-step replay',
        'Get full sequence, not a snapshot',
        'Understand hard-to-describe issues',
      ],
      image: getRoleFeatureUrl('microsites/roles/support-agents/support-agents-user-actions.png'),
      learnMoreHref: DOCS_HELPDESK_SETUP,
    },
    {
      number: '02',
      title: 'Get to the root cause',
      description:
        'Every recording includes console errors, network requests, browser metadata, and a step-by-step action trail. So you can triage issues with complete context upfront. No follow-ups needed.',
      tagline: 'Everything you need to triage',
      capabilities: [
        'Console logs and error traces',
        'Network request snapshots',
        'Step-by-step user actions',
        'Browser and device metadata',
      ],
      image: getRoleFeatureUrl('microsites/roles/support-agents/support-agents-root-cause.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'No context switch needed',
      description:
        'Userplane fits into your existing support workflow. Request and review recordings from the sidebar, shortcuts, and macros — without leaving Intercom, Zendesk, or Slack.',
      tagline: 'Works where you already work',
      capabilities: [
        'Intercom, Zendesk, and Slack integrations',
        'Includes support for macros and shortcuts',
        'No context switching required',
        'No new tools to learn',
      ],
      image: getRoleFeatureUrl(
        'microsites/roles/support-agents/support-agents-helpdesk-recording.png'
      ),
      learnMoreHref: DOCS_HELPDESK_SETUP,
    },
    {
      number: '04',
      title: 'Built for compliance',
      description:
        'Sensitive data gets redacted and confidential fields get blurred automatically. Built-in consent controls — so your team gets full context without any compliance risk.',
      tagline: 'Compliant out of the box',
      capabilities: [
        'Automatic PII redaction',
        'Field-level blurring',
        'GDPR & CCPA compliant',
        'Customer consent controls',
      ],
      image: getRoleFeatureUrl('microsites/roles/support-agents/support-agents-consent-screen.png'),
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
      lines: ['Stop guessing what went wrong'],
      highlights: [
        { wordIndex: 3, color: 'blue' },
        { wordIndex: 4, color: 'blue' },
      ],
    },
    description:
      'Resolve issues on first contact with screen recordings, console logs, network requests, and user steps.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'Talk to a Human', href: TALLY_SALES_FORM_URL },
  },
});
