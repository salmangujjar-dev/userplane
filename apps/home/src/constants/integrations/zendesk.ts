import { mergeTransformOptions } from '@userplane/storage/media';

import { mediaClient } from '../../lib/media';
import { SIGNUP_URL } from '../onboarding';
import { defineIntegration } from './defaults';

export const zendeskConfig = defineIntegration({
  slug: 'zendesk',
  name: 'Zendesk',
  url: 'https://zendesk.com',
  gradient: {
    stops: [
      'rgba(3, 54, 61, 0.2)',
      'rgba(23, 73, 77, 0.2)',
      'rgba(120, 163, 0, 0.2)',
      'rgba(3, 54, 61, 0.2)',
    ],
  },
  seo: {
    title: 'Zendesk Screen Recording Integration | Userplane',
    description:
      'Add screen recordings to Zendesk tickets. Agents request a recording from the ticket sidebar, and it comes back with console logs, network data, and browser metadata attached.',
    keywords:
      'zendesk screen recording, zendesk integration, zendesk ticket recording, zendesk support tool, userplane, screen recording for zendesk, zendesk marketplace app',
    ogImage: '/images/preview/og-zendesk.webp',
  },
  hero: {
    headline: {
      lines: ['Screen recordings that', 'live inside'],
      accent: 'Zendesk',
    },
    description:
      'Userplane adds a recording sidebar to every Zendesk ticket. Agents request a screen recording with one click, and the customer records without installing anything. The recording lands back on the ticket with console logs, network data, and browser metadata attached.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'See Demo', href: '/demo' },
    preview: {
      src: mediaClient.getMicrositeMediaUrl('microsites/zendesk/hero.png', {
        transform: mergeTransformOptions('feature', { width: 1440 }),
      }),
      alt: 'Zendesk ticket sidebar with Userplane recording request',
    },
  },
  features: [
    {
      number: '01',
      title: 'Zendesk Marketplace app',
      description:
        'Userplane installs from the Zendesk Marketplace and adds a sidebar widget to every ticket. Agents request recordings with one click, and each recording is automatically linked back to the originating ticket -- no manual bookkeeping.',
      tagline: 'Built for the ticket workflow',
      capabilities: [
        'Sidebar widget in every ticket',
        'One-click recording requests',
        'Ticket-linked recordings',
        'Works with Zendesk Support & Suite',
      ],
      image: mediaClient.getMicrositeMediaUrl('microsites/zendesk/feat-01.png', {
        transform: mergeTransformOptions('feature', { width: 864 }),
      }),
    },
    {
      number: '02',
      title: 'Automatic technical context',
      description:
        'Every recording silently captures console logs, network requests, browser metadata, and a user action trail. Engineers get the full picture without asking customers to open DevTools or describe their setup.',
      tagline: 'Full-stack visibility',
      capabilities: [
        'Console logs & errors',
        'Network request waterfall',
        'Browser & OS metadata',
        'Step-by-step user action trail',
      ],
      image: mediaClient.getMicrositeMediaUrl('microsites/zendesk/feat-02.png', {
        transform: mergeTransformOptions('feature', { width: 864 }),
      }),
    },
    {
      number: '03',
      title: 'Privacy-first recording',
      description:
        'PII is masked and redacted before recordings reach your team. Configurable redaction rules, consent controls, and full GDPR/CCPA compliance mean you can capture everything you need without compromising customer trust.',
      tagline: 'Compliant by default',
      capabilities: [
        'Automatic PII masking',
        'Configurable redaction rules',
        'GDPR & CCPA compliant',
        'Customer consent controls',
      ],
      image: mediaClient.getMicrositeMediaUrl('microsites/zendesk/feat-03.png', {
        transform: mergeTransformOptions('feature', { width: 864 }),
      }),
    },
  ],
});
