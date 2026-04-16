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
    title: 'Userplane for Customer Success | Resolve Issues Customers Struggle to Describe',
    description:
      'Understand harder to describe issues. Every recording carries console logs, network data, and full session context.',
    keywords:
      'customer success tools, screen recording customer success, resolve issues faster, technical context, session replay, csm tools, userplane',
  },
  hero: {
    headline: {
      lines: ['Built for teams', 'customers count on'],
      highlights: [
        { wordIndex: 4, color: 'green' },
        { wordIndex: 5, color: 'green' },
      ],
    },
    description: [
      'Screen recordings with console logs and session details.',
      'Capture harder to describe support issues.',
    ],
    preview: {
      src: getRoleHeroUrl('microsites/roles/customer-success/hero.png'),
      alt: 'Userplane screen recording with full technical context for CS teams',
    },
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'Talk to a Human', href: TALLY_SALES_FORM_URL },
  },
  features: [
    {
      number: '01',
      title: 'Full session context, upfront',
      description:
        'Resolve harder-to-describe customer issues. Request screen recordings which include console errors, network failures, and the exact steps that led to the issue.',
      tagline: 'Complete picture on first contact',
      capabilities: [
        'Full session replay',
        'Step-by-step action trail',
        'Console and network data',
        'Browser and device metadata',
      ],
      image: getRoleFeatureUrl(
        'microsites/roles/customer-success/customer-success-helpdesk-recording.png'
      ),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '02',
      title: 'Console logs and network data',
      description:
        'Automatically collect network requests, browser logs, and device details with every recording. Get to the root cause without involving engineering.',
      tagline: 'Triage without escalating',
      capabilities: [
        'Console logs and error traces',
        'Network request snapshots',
        'Application state capture',
        'Device and browser details',
      ],
      image: getRoleFeatureUrl(
        'microsites/roles/customer-success/customer-success-console-logs.png'
      ),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Native help desk integration',
      description:
        'Request and review recordings from Intercom, Zendesk, or Slack. Recordings live alongside the conversation — accessible to everyone involved. No context switching required.',
      tagline: 'Works where you already work',
      capabilities: [
        'Intercom sidebar integration',
        'Zendesk ticket integration',
        'Slack recording requests',
        'Chrome extension integration',
      ],
      image: getRoleFeatureUrl(
        'microsites/roles/customer-success/customer-success-helpdesk-setup.png'
      ),
      learnMoreHref: DOCS_HELPDESK_SETUP,
    },
    {
      number: '04',
      title: 'Enterprise-grade privacy controls',
      description:
        'Sensitive fields are redacted before recordings leave the browser. GDPR and CCPA compliant. Turn moments of friction into moments of trust.',
      tagline: 'Built for Trust',
      capabilities: [
        'Automatic PII redaction',
        'Custom data retention',
        'Role-based access control',
        'GDPR & CCPA compliant',
      ],
      image: getRoleFeatureUrl(
        'microsites/roles/customer-success/customer-success-consent-screen.png'
      ),
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
      lines: ['Resolve complex issues without back-and-forth'],
      highlights: [
        { wordIndex: 1, color: 'green' },
        { wordIndex: 2, color: 'green' },
      ],
    },
    description:
      'Screen recordings with console logs, network data, and session metadata. Handle complex issues without the escalation.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'Talk to a Human', href: TALLY_SALES_FORM_URL },
  },
});
