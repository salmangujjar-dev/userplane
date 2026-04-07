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
    title: 'Userplane for Support Engineers | Engineer-Ready Artifacts from Every Ticket',
    description:
      'Console logs, network data, repro steps, and full session recordings. Complete context from first contact — no chasing details.',
    keywords:
      'support engineer tools, bug report context, repro steps, console logs support, engineer-ready tickets, clean handoffs, userplane',
  },
  hero: {
    headline: {
      lines: ['Engineer-ready artifacts', 'from every support ticket'],
      highlights: [{ wordIndex: 0, color: 'blue' }],
    },
    description: [
      'Console logs, network data, repro steps, and a full session recording.',
      'Complete context from first contact — no chasing details.',
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
        'Console errors, network waterfalls, and user action trails — attached to every recording. Triage with real data instead of descriptions.',
      tagline: 'Root cause, not guesswork',
      capabilities: [
        'Console logs and error traces',
        'Network request waterfall',
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
        'Every ticket arrives with the steps to reproduce. No follow-ups, no screenshots requested after the fact, no incomplete bug reports.',
      tagline: 'No more back-and-forth',
      capabilities: [
        'Automatic repro step capture',
        'Session metadata included',
        'Browser & OS fingerprint',
        'Complete action timeline',
      ],
      image: getRoleFeatureUrl('microsites/support-engineers/engineer-repro.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Clean handoffs to engineering',
      description:
        'One link. Recording, console logs, network data, and session metadata. Pass it to engineering with nothing missing.',
      tagline: 'Nothing lost between teams',
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
        'GDPR and CCPA. Role-based access, custom retention policies, and SAML SSO. Configure once, apply across the team.',
      tagline: 'Set it up once',
      capabilities: [
        'GDPR & CCPA compliance',
        'Role-based access control',
        'Custom data retention',
        'SAML SSO',
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
      lines: ['Stop chasing', 'missing context'],
      highlights: [{ wordIndex: 2, color: 'blue' }],
    },
    description:
      'Every ticket ships with console logs, network data, repro steps, and a full session recording.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'Talk to a Human', href: TALLY_SALES_FORM_URL },
  },
});
