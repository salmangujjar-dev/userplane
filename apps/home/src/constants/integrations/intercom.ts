import { mergeTransformOptions } from '@userplane/storage/media';

import { mediaClient } from '../../lib/media';
import { SIGNUP_URL } from '../onboarding';
import { defineIntegration } from './defaults';

export const intercomConfig = defineIntegration({
  slug: 'intercom',
  name: 'Intercom',
  url: 'https://intercom.com',
  gradient: {
    stops: [
      'rgba(0, 122, 255, 0.2)',
      'rgba(40, 110, 250, 0.2)',
      'rgba(59, 80, 246, 0.2)',
      'rgba(0, 142, 255, 0.2)',
    ],
  },
  seo: {
    title: 'Intercom Screen Recording Integration | Userplane',
    description:
      'Add screen recordings to Intercom conversations. Capture console logs, network requests, and session replays without leaving the Intercom Messenger.',
    keywords:
      'intercom screen recording, intercom integration, intercom messenger app, intercom support tool, intercom bug reporting, screen recording intercom, userplane intercom, customer support screen recording',
    ogImage: '/images/preview/og-intercom.webp',
  },
  hero: {
    headline: {
      lines: ['Screen recordings that', 'live inside'],
      accent: 'Intercom',
    },
    description:
      'Userplane is the screen recording layer for Intercom. Request recordings from the Messenger, capture console logs and network data automatically, and replay issues without leaving your conversation.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'See Demo', href: '/demo' },
    preview: {
      src: mediaClient.getMicrositeMediaUrl('microsites/intercom/hero.png', {
        transform: mergeTransformOptions('feature', { width: 1440 }),
      }),
      alt: 'Userplane screen recording inside an Intercom conversation',
    },
  },
  features: [
    {
      number: '01',
      title: 'Native Intercom Messenger app',
      description:
        'Userplane installs as a native app inside the Intercom Messenger. Request recordings, view playbacks, and share replays without switching tabs. The entire workflow stays in your conversation.',
      tagline: 'Built for Intercom',
      capabilities: [
        'One-click recording requests from conversations',
        'Inline playback in Intercom sidebar',
        'Recordings linked to conversation threads',
        'Works with Intercom Inbox and Help Desk',
      ],
      image: mediaClient.getMicrositeMediaUrl('microsites/intercom/feat-01.png', {
        transform: mergeTransformOptions('feature', { width: 864 }),
      }),
    },
    {
      number: '02',
      title: 'Console logs, network data, and session metadata',
      description:
        'Every recording captures the full technical stack behind what the customer sees. Console errors, failed API calls, slow network requests, and browser details are attached automatically — so your engineering team stops asking "can you send me a screenshot?"',
      tagline: 'Full technical context',
      capabilities: [
        'Console logs and JavaScript errors',
        'Network request waterfall with timing',
        'Browser, OS, and viewport metadata',
        'Timestamped user action trail',
      ],
      image: mediaClient.getMicrositeMediaUrl('microsites/intercom/feat-02.png', {
        transform: mergeTransformOptions('feature', { width: 864 }),
      }),
    },
    {
      number: '03',
      title: 'Privacy controls built in',
      description:
        "Sensitive fields are automatically masked before recordings leave the customer's browser. Configure element-level redaction rules, enforce consent flows, and stay compliant with GDPR and CCPA out of the box.",
      tagline: 'Private by default',
      capabilities: [
        'Automatic PII masking and field blurring',
        'Configurable redaction rules per domain',
        'GDPR and CCPA compliant by design',
        'Customer-controlled consent flow',
      ],
      image: mediaClient.getMicrositeMediaUrl('microsites/intercom/feat-03.png', {
        transform: mergeTransformOptions('feature', { width: 864 }),
      }),
    },
  ],
});
