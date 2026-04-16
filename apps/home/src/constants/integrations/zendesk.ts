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
        'Userplane installs as a native Zendesk app, enabling screen recording for your entire team. Agents request screen recordings, which capture console logs, network activity, and user context helping your team resolve issues faster.',
      tagline: 'Built for Zendesk tickets',
      capabilities: [
        'Request recordings without leaving Zendesk',
        'Keep all context linked to the Zendesk ticket',
        'Works with Zendesk Support & Suite out of the box',
        'Available in Zendesk sidebar, editor, top-bar and macros',
      ],
      image: getFeatureUrl('microsites/integrations/zendesk/zendesk-helpdesk-recording.png'),
      learnMoreHref: DOCS_HELPDESK_SETUP,
    },
    {
      number: '02',
      title: 'Everything you need to debug',
      description:
        'Each recording comes with full technical context behind what the customer sees — console errors, network activity, and user steps — so your team can skip the guesswork and jump straight to the root cause.',
      tagline: 'Full-stack visibility',
      capabilities: [
        'Capture console logs and error traces',
        'Inspect and analyze network requests',
        'Access environment and application context',
        'Reconstruct user sessions step by step',
      ],
      image: getFeatureUrl('microsites/integrations/zendesk/zendesk-console-logs.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Privacy-first recording',
      description:
        'PII is masked and redacted before recordings reach your team. Configurable redaction rules, consent controls, and full GDPR/CCPA compliance mean you can capture everything you need without compromising customer trust.',
      tagline: 'Compliant by default',
      capabilities: [
        'Protect sensitive data with masking and redaction',
        'Set redaction rules for each domain and customer',
        'Ensure compliance with GDPR and CCPA out of the box',
        'Manage customer consent with built-in controls',
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
