import { SIGNUP_URL } from '../onboarding';
import { defineIntegration } from './_defaults';

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
      src: 'https://placehold.co/1440x800/f8f8f8/cccccc?text=Zendesk+Integration',
      alt: 'Zendesk ticket sidebar with Userplane recording request',
    },
  },
  steps: {
    headline: {
      before: 'Userplane',
      segments: [
        { accent: 'captures', after: 'what your customer sees,' },
        { accent: 'attaches', after: 'it to the ticket, and delivers' },
        { accent: 'resolution', after: 'without the back and forth.' },
      ],
    },
    steps: [
      {
        number: '01',
        title: 'Request a recording from the ticket sidebar',
        description:
          'Open any Zendesk ticket and click the Userplane widget in the sidebar. A recording link is sent to the customer instantly -- no copy-pasting or tab switching required.',
        image: 'https://placehold.co/400x220/f8f8f8/cccccc?text=Step+01',
      },
      {
        number: '02',
        title: 'Customer records their screen',
        description:
          'Your customer clicks the link and records what went wrong. No browser extension or software install needed -- everything runs in the browser.',
        image: 'https://placehold.co/400x220/f8f8f8/cccccc?text=Step+02',
      },
      {
        number: '03',
        title: 'Recording attaches to the ticket with full context',
        description:
          'The finished recording appears on the Zendesk ticket alongside console logs, a network waterfall, browser metadata, and a step-by-step action trail.',
        image: 'https://placehold.co/400x220/f8f8f8/cccccc?text=Step+03',
      },
    ],
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
      image: 'https://placehold.co/864x540/f8f8f8/cccccc?text=Zendesk+Marketplace+app',
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
      image: 'https://placehold.co/864x540/f8f8f8/cccccc?text=Automatic+technical+context',
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
      image: 'https://placehold.co/864x540/f8f8f8/cccccc?text=Privacy-first+recording',
    },
  ],
});
