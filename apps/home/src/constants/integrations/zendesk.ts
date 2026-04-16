import { TALLY_SALES_FORM_URL } from '../contact';
import { SIGNUP_URL } from '../onboarding';
import { getDashUrl } from '../urls';
import { defineIntegration } from './defaults';
import {
  DOCS_HELPDESK_SETUP,
  DOCS_RECORDING_REQUESTING,
  DOCS_SENSITIVE_DATA_REDACTION,
  DOCS_ZENDESK,
} from './links';
import { getFeatureUrl, getHeroUrl, getIconUrl } from './media';

export const zendeskConfig = defineIntegration({
  slug: 'zendesk',
  name: 'Zendesk',
  url: 'https://zendesk.com',
  icon: { src: getIconUrl('integrations/zendesk.webp'), alt: 'Zendesk' },
  gradient: {
    stops: [
      'rgba(3, 54, 61, 0.1)',
      'rgba(23, 73, 77, 0.1)',
      'rgba(120, 163, 0, 0.1)',
      'rgba(3, 54, 61, 0.1)',
    ],
  },
  seo: {
    title: 'Zendesk Screen Recording Integration | Userplane',
    description:
      'Close Zendesk tickets on first contact. Each request returns a recording with console logs, network data, and session activity.',
    keywords:
      'zendesk screen recording, zendesk integration, zendesk ticket recording, zendesk support tool, userplane, screen recording for zendesk, zendesk marketplace app',
  },
  hero: {
    headline: {
      lines: ['Screen Recordings that', 'live inside Zendesk'],
      highlights: [{ wordIndex: 5, color: 'green' }],
      icons: [
        {
          wordIndex: 5,
          src: getIconUrl('integrations/zendesk.webp'),
          alt: 'Zendesk',
        },
      ],
    },
    description: [
      'Userplane brings screen recordings into Zendesk.',
      'Close tickets faster with full technical context upfront.',
    ],
    preview: {
      src: getHeroUrl('microsites/integrations/zendesk/hero.png'),
      alt: 'Zendesk ticket sidebar with Userplane recording request',
    },
    marketplace: {
      label: 'Zendesk App Store',
      href: getDashUrl('/_/settings?tab=integrations'),
      icon: { src: getIconUrl('integrations/zendesk.webp'), alt: 'Zendesk' },
    },
  },
  features: [
    {
      number: '01',
      title: 'Designed for Zendesk',
      description:
        'A native Zendesk app for screen recordings. Capture logs, network activity, and user context to speed up ticket resolution.',
      tagline: 'Built for Zendesk tickets',
      capabilities: [
        'Request recordings inside Zendesk',
        'Link recordings to Zendesk tickets',
        'Built for Zendesk Support Suite',
        'Works in sidebar editor and macros',
      ],
      image: getFeatureUrl('microsites/integrations/zendesk/zendesk-helpdesk-recording.png'),
      learnMoreHref: DOCS_HELPDESK_SETUP,
    },
    {
      number: '02',
      title: 'Everything you need to debug',
      description:
        'From console errors to user steps, every recording include complete session context — so your team can identify root causes instantly.',
      tagline: 'Full-stack visibility',
      capabilities: [
        'Inspect console logs and errors',
        'Full network trace for every issue',
        'Full view of app and environment',
        'Reconstruct sessions step by step',
      ],
      image: getFeatureUrl('microsites/integrations/zendesk/zendesk-console-logs.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Privacy-first recording',
      description:
        'Mask and redact sensitive data before it reaches your team. Control redaction, manage consent, and stay compliant by default.',
      tagline: 'Compliant by default',
      capabilities: [
        'Mask and redact sensitive data',
        'Customize data redaction rules',
        'Compliance ready out of the box',
        'Built in controls for user consent',
      ],
      image: getFeatureUrl('microsites/integrations/zendesk/zendesk-data-redaction.png'),
      learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
    },
  ],
  resources: { seeAllHref: DOCS_ZENDESK },
  cta: {
    headline: {
      lines: ['Request screen recordings', 'right within Zendesk'],
      highlights: [
        // { wordIndex: 1, color: 'blue' },
        // { wordIndex: 2, color: 'blue' },
        { wordIndex: 5, color: 'green' },
      ],
      icons: [
        {
          wordIndex: 5,
          position: 'before',
          src: getIconUrl('integrations/zendesk.webp'),
          alt: 'Zendesk',
        },
      ],
    },
    description:
      "Share recording links from Zendesk and get back a complete replay of the customer's issue.",
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'Talk to a Human', href: TALLY_SALES_FORM_URL },
  },
});
