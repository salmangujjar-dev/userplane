import { TALLY_SALES_FORM_URL } from '../contact';
import { SIGNUP_URL } from '../onboarding';
import { defineRole } from './defaults';
import {
  DOCS_FOR_SUPPORT_ENGINEERS,
  DOCS_HELPDESK_SETUP,
  DOCS_RECORDING_REQUESTING,
  DOCS_SENSITIVE_DATA_REDACTION,
} from './links';
import { getRoleFeatureUrl, getRoleHeroUrl } from './media';

export const supportEngineersConfig = defineRole({
  slug: 'support-engineers',
  name: 'Support Engineers',
  shortName: 'Engineers',
  gradient: {
    stops: [
      'rgba(59, 130, 246, 0.1)',
      'rgba(37, 99, 235, 0.1)',
      'rgba(79, 70, 229, 0.1)',
      'rgba(99, 102, 241, 0.1)',
    ],
  },
  seo: {
    title:
      'Userplane for Support Engineers | Console Logs, Network Data, and Repro Steps with Every Ticket',
    description:
      'Console logs, network data, repro steps, and full session recordings. Complete context from first contact — no chasing customers for details.',
    keywords:
      'support engineer tools, bug report context, repro steps, console logs support, engineer-ready tickets, clean handoffs, userplane',
  },
  hero: {
    headline: {
      lines: ['Get to the root cause', 'on the first look'],
      highlights: [{ wordIndex: 3, color: 'blue' }],
    },
    description: [
      'Console logs, network data, repro steps, and a full session recording.',
      'Get everything you need to diagnose the issue.',
    ],
    preview: {
      src: getRoleHeroUrl('microsites/support-engineers/hero.png'),
      alt: 'Userplane session recording with console logs and network data',
    },
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'Talk to a Human', href: TALLY_SALES_FORM_URL },
  },
  features: [
    {
      number: '01',
      title: 'Trace issues to the source',
      description:
        'Console errors, request snapshots, and session data — attached to every recording. Get to root cause without reconstructing the issue manually.',
      tagline: 'Root cause, not guesswork',
      capabilities: [
        'Console logs and error traces',
        'Network request snapshot',
        'Application state and user context',
        'Step-by-step action trail',
      ],
      image: getRoleFeatureUrl('microsites/support-engineers/engineer-context.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '02',
      title: 'Repro-ready on first contact',
      description:
        'With Userplane, every ticket arrives with exact steps to reproduce along with session data and environment details. No additional follow-ups needed.',
      tagline: 'Skip the back-and-forth',
      capabilities: [
        'Reproduce any issue instantly',
        'Get full session and network context',
        'Diagnose problems on the first pass',
        'Step-by-step timeline of user actions',
      ],
      image: getRoleFeatureUrl('microsites/support-engineers/engineer-repro.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Clean handoffs to engineering',
      description:
        'Pass the full context to engineering in one link. Screen recording, console logs, network data, and session details — all attached.',
      tagline: 'Engineering-ready artifacts',
      capabilities: [
        'Shareable recording links',
        'Logs and metadata attached',
        'Works with Jira, Linear, Slack',
        'Engineer-ready from day one',
      ],
      image: getRoleFeatureUrl('microsites/support-engineers/engineer-handoff.png'),
      learnMoreHref: DOCS_HELPDESK_SETUP,
    },
    {
      number: '04',
      title: 'Enterprise-grade compliance',
      description:
        'Built for teams with strict compliance requirements. GDPR, CCPA, sensitive data redaction, custom retention policies, consent management and more.',
      tagline: 'Compliant out of the box',
      capabilities: [
        'Blur and mask confidential fields',
        'Built for sensitive environments',
        'Custom data retention policies',
        'GDPR & CCPA compliance',
      ],
      image: getRoleFeatureUrl('microsites/support-engineers/engineer-compliance.png'),
      learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
    },
  ],
  resources: {
    links: [
      {
        label: 'Getting Started',
        title: 'Support Engineer Onboarding',
        description:
          'Configure your workspace, set up domains, manage recording link settings, and keep sensitive data secure.',
        href: DOCS_FOR_SUPPORT_ENGINEERS,
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
    seeAllHref: DOCS_FOR_SUPPORT_ENGINEERS,
  },
  cta: {
    headline: {
      lines: ['Complete visibility into every customer issue'],
      highlights: [
        { wordIndex: 0, color: 'blue' },
        { wordIndex: 1, color: 'blue' },
        { wordIndex: 4, color: 'blue' },
        { wordIndex: 5, color: 'blue' },
      ],
    },
    description:
      'Stop guessing what went wrong. See exactly what happened and trace it to the root cause.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'Talk to a Human', href: TALLY_SALES_FORM_URL },
  },
});
