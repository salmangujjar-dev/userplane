import { TALLY_SALES_FORM_URL } from '../contact';
import { SIGNUP_URL } from '../onboarding';
import { defineRole } from './defaults';
import {
  DOCS_HELPDESK_SETUP,
  DOCS_RECORDING_REQUESTING,
  DOCS_SENSITIVE_DATA_REDACTION,
} from './links';
import { getRoleFeatureUrl, getRoleHeroUrl } from './media';

export const customerSuccessConfig = defineRole({
  slug: 'customer-success',
  name: 'Customer Success',
  shortName: 'CS Teams',
  gradient: {
    stops: [
      'rgba(16, 185, 129, 0.1)',
      'rgba(5, 150, 105, 0.1)',
      'rgba(20, 184, 166, 0.1)',
      'rgba(13, 148, 136, 0.1)',
    ],
  },
  seo: {
    title: 'Userplane for Customer Success | Resolve Dense Issues Without Escalating',
    description:
      'Screen recordings with console logs, network data, and session metadata. Handle complex customer issues directly — without pulling in engineering.',
    keywords:
      'customer success tools, screen recording customer success, resolve issues faster, technical context, session replay, csm tools, userplane',
  },
  hero: {
    headline: {
      lines: ['Resolve dense issues', 'without the escalation'],
      highlights: [{ wordIndex: 1, color: 'green' }],
    },
    description: [
      'Screen recordings with console logs, network data, and session metadata.',
      'Handle complex issues directly — without pulling in engineering.',
    ],
    preview: {
      src: getRoleHeroUrl('microsites/customer-success/hero.png'),
      alt: 'Userplane session recording with full technical context for CS teams',
    },
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'Talk to a Human', href: TALLY_SALES_FORM_URL },
  },
  features: [
    {
      number: '01',
      title: 'Full session context, upfront',
      description:
        'Screen recordings with console errors, network failures, and the exact steps that led to the issue — all in one recording.',
      tagline: 'Complete picture, first contact',
      capabilities: [
        'Full session replay',
        'Step-by-step action trail',
        'Console and network data',
        'Browser and device metadata',
      ],
      image: getRoleFeatureUrl('microsites/customer-success/cs-recording.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '02',
      title: 'Console logs and network data',
      description:
        'Automatically collect network requests, browser logs, and device metadata with every recording. Technical depth without the engineering dependency.',
      tagline: 'Depth without the escalation',
      capabilities: [
        'Console logs and error traces',
        'Network request waterfall',
        'Application state capture',
        'Device and browser fingerprint',
      ],
      image: getRoleFeatureUrl('microsites/customer-success/cs-context.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Native help desk integration',
      description:
        'Request and review recordings directly from Intercom, Zendesk, or Slack. No context switching, no separate tools.',
      tagline: 'Works where you already work',
      capabilities: [
        'Intercom sidebar integration',
        'Zendesk ticket integration',
        'Slack recording requests',
        'No context switching',
      ],
      image: getRoleFeatureUrl('microsites/customer-success/cs-integration.png'),
      learnMoreHref: DOCS_HELPDESK_SETUP,
    },
    {
      number: '04',
      title: 'Compliance out of the box',
      description:
        'Automatic PII redaction. Custom data retention policies. Role-based access controls. GDPR and CCPA compliant.',
      tagline: 'Built in, not bolted on',
      capabilities: [
        'Automatic PII redaction',
        'Custom data retention',
        'Role-based access control',
        'GDPR & CCPA compliant',
      ],
      image: getRoleFeatureUrl('microsites/customer-success/cs-compliance.png'),
      learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
    },
  ],
  resources: {
    links: [
      {
        label: 'Getting Started',
        title: 'Customer Success Onboarding',
        description:
          'Start collecting screen recordings from customers and reviewing sessions inside your help desk.',
        href: DOCS_HELPDESK_SETUP,
      },
      {
        label: 'Recording',
        title: 'How Screen Recording Works',
        description:
          'Learn how recordings capture console logs, network requests, and session metadata automatically.',
        href: DOCS_RECORDING_REQUESTING,
      },
      {
        label: 'Privacy',
        title: 'Sensitive Data Redaction',
        description:
          'Configure what gets captured and redacted. Automatic PII masking and compliance controls.',
        href: DOCS_SENSITIVE_DATA_REDACTION,
      },
    ],
    seeAllHref: DOCS_HELPDESK_SETUP,
  },
  cta: {
    headline: {
      lines: ['Get the full technical', 'context upfront'],
      highlights: [
        { wordIndex: 3, color: 'green' },
        { wordIndex: 4, color: 'green' },
      ],
    },
    description:
      'Screen recordings with console logs, network data, and session metadata. Handle complex issues without the escalation.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'Talk to a Human', href: TALLY_SALES_FORM_URL },
  },
});
