import { TALLY_SALES_FORM_URL } from '../contact';
import { SIGNUP_URL } from '../onboarding';
import { defineIntegration } from './defaults';
import {
  DOCS_HELPDESK_SETUP,
  DOCS_INTERCOM,
  DOCS_RECORDING_REQUESTING,
  DOCS_SENSITIVE_DATA_REDACTION,
} from './links';
import { getFeatureUrl, getHeroUrl, getIconUrl } from './media';

export const intercomConfig = defineIntegration({
  slug: 'intercom',
  name: 'Intercom',
  url: 'https://intercom.com',
  icon: { src: getIconUrl('integrations/intercom.webp'), alt: 'Intercom' },
  gradient: {
    stops: [
      'rgba(0, 122, 255, 0.1)',
      'rgba(40, 110, 250, 0.1)',
      'rgba(59, 80, 246, 0.1)',
      'rgba(0, 142, 255, 0.1)',
    ],
  },
  seo: {
    title: 'Intercom Screen Recording Integration | Userplane',
    description:
      'Request screen recordings without leaving Intercom. Capture console logs, network requests, and session replays to understand and resolve support issues faster.',
    keywords:
      'intercom screen recording, intercom integration, intercom messenger app, intercom support tool, intercom bug reporting, screen recording intercom, userplane intercom, customer support screen recording',
  },
  hero: {
    headline: {
      lines: ['Request screen recordings', 'without leaving Intercom'],
      highlights: [{ wordIndex: 5, color: 'blue' }],
      icons: [
        {
          wordIndex: 5,
          src: getIconUrl('integrations/intercom.webp'),
          alt: 'Intercom',
        },
      ],
    },
    description: [
      'Userplane embeds screen recording into Intercom.',
      'So your team can understand and resolve support issues faster.',
    ],
    preview: {
      src: getHeroUrl('microsites/integrations/intercom/hero.png'),
      alt: 'Userplane screen recording inside an Intercom conversation',
    },
    marketplace: {
      label: 'Intercom App Store',
      href: 'https://www.intercom.com/app-store/?app_package_code=userplane-5jk4&category=for-support-agents',
      icon: { src: getIconUrl('integrations/intercom.webp'), alt: 'Intercom' },
    },
  },
  features: [
    {
      number: '01',
      title: 'Built for Intercom',
      description:
        'Userplane brings screen recordings into Intercom Messenger, so your team can see exactly what went wrong and resolve issues faster. Send one-click recording links that work anywhere. No apps, installs, or extensions required.',
      tagline: 'Native Intercom integration',
      capabilities: [
        'Request recordings without leaving Messenger',
        'No apps, installs, or extensions required',
        'Recordings stay linked to the conversation',
        'Works across Inbox, Messenger, and Macros',
      ],
      image: getFeatureUrl('microsites/integrations/intercom/intercom-helpdesk-recording.png'),
      learnMoreHref: DOCS_HELPDESK_SETUP,
    },
    {
      number: '02',
      title: 'Console logs, network data, and session details',
      description:
        'Each recording includes the full technical context behind what the customer sees — console errors, network activity, and user steps — so your team can get to the root cause faster.',
      tagline: 'Full technical context',
      capabilities: [
        'Capture console logs and error traces',
        'Get network activity and request details',
        'Follow complete session and action trail',
        'Access application state and user context',
      ],
      image: getFeatureUrl('microsites/integrations/intercom/intercom-console-logs.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Privacy controls built in',
      description:
        "Sensitive data is masked before recordings ever leave the customer's browser. Configure exactly what gets captured, enforce consent, and meet compliance requirements with ease.",
      tagline: 'Private by default',
      capabilities: [
        'PII masking and confidential field blurring',
        'Configurable redaction rules per domain',
        'GDPR and CCPA compliance by design',
        'Flexible customer-driven consent flow',
      ],
      image: getFeatureUrl('microsites/integrations/intercom/intercom-data-redaction.png'),
      learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
    },
  ],
  resources: { seeAllHref: DOCS_INTERCOM },
  cta: {
    headline: {
      lines: ['Resolve support issues faster', 'right inside Intercom'],
      highlights: [
        // { wordIndex: 1, color: 'yellow' },
        // { wordIndex: 2, color: 'yellow' },
        { wordIndex: 6, color: 'blue' },
      ],
      icons: [
        {
          wordIndex: 6,
          src: getIconUrl('integrations/intercom.webp'),
          alt: 'Intercom',
        },
      ],
    },
    description:
      "Request screen recordings and get back a complete replay of the customer's experience.",
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'Talk to a Human', href: TALLY_SALES_FORM_URL },
  },
});
