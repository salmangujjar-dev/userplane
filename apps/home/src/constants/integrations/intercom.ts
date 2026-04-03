import { SIGNUP_URL } from '../onboarding';
import { defineIntegration } from './_defaults';

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
      src: 'https://placehold.co/1440x800/f8f8f8/cccccc?text=Intercom+Integration',
      alt: 'Userplane screen recording inside an Intercom conversation',
    },
  },
  steps: {
    headline: {
      before: 'Userplane',
      segments: [
        { accent: 'captures', after: 'what your customer sees,' },
        { accent: 'attaches', after: 'technical context, and delivers' },
        { accent: 'resolution', after: 'without the back and forth.' },
      ],
    },
    steps: [
      {
        number: '01',
        title: 'Request a recording from the Messenger',
        description:
          'Open the Userplane app inside your Intercom conversation and send a recording request. Your customer receives a one-click link — no downloads or extensions required.',
        image: 'https://placehold.co/400x220/f8f8f8/cccccc?text=Step+01',
      },
      {
        number: '02',
        title: 'Customer records their screen',
        description:
          'Your customer clicks the link, grants screen access, and shows you the issue. Console logs, network requests, and browser metadata are captured in the background automatically.',
        image: 'https://placehold.co/400x220/f8f8f8/cccccc?text=Step+02',
      },
      {
        number: '03',
        title: 'Replay the recording in Intercom',
        description:
          'The completed recording appears directly in your Intercom conversation. Watch the replay with a full timeline of console errors, network failures, and step-by-step user actions.',
        image: 'https://placehold.co/400x220/f8f8f8/cccccc?text=Step+03',
      },
    ],
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
      image: 'https://placehold.co/864x540/f8f8f8/cccccc?text=Native+Intercom+Messenger+app',
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
      image: 'https://placehold.co/864x540/f8f8f8/cccccc?text=Console+logs+and+network+data',
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
      image: 'https://placehold.co/864x540/f8f8f8/cccccc?text=Privacy+controls',
    },
  ],
});
