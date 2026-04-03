import { SIGNUP_URL } from '../onboarding';
import { defineIntegration } from './_defaults';

export const chromeExtensionConfig = defineIntegration({
  slug: 'chrome-extension',
  name: 'Chrome Extension',
  url: 'https://chrome.google.com/webstore',
  gradient: {
    stops: [
      'rgba(66, 133, 244, 0.2)',
      'rgba(52, 168, 83, 0.2)',
      'rgba(251, 188, 5, 0.2)',
      'rgba(234, 67, 53, 0.2)',
    ],
  },
  seo: {
    title: 'Chrome Extension Screen Recording | Userplane',
    description:
      'Capture screen recordings with technical context straight from Chrome. One click to record, automatic console logs and network data, and an instant shareable link for your support team.',
    keywords:
      'chrome extension screen recording, browser screen recording, chrome screen capture, screen recording extension, userplane, chrome devtools recording, browser capture tool',
    ogImage: '/images/preview/og-chrome-extension.webp',
  },
  hero: {
    headline: {
      lines: ['Screen recordings from', 'your'],
      accent: 'Chrome',
    },
    description:
      'Click the Userplane icon in Chrome to start recording. Console logs, network requests, and browser metadata are captured automatically in the background -- no setup for your customers, no installs, no friction. Share the recording with your support team in one click.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'See Demo', href: '/demo' },
    preview: {
      src: 'https://placehold.co/1440x800/f8f8f8/cccccc?text=Chrome+Extension',
      alt: 'Userplane Chrome Extension recording a browser session',
    },
  },
  steps: {
    headline: {
      before: 'Userplane',
      segments: [
        { accent: 'records', after: 'your screen,' },
        { accent: 'captures', after: 'technical context, and' },
        { accent: 'shares', after: 'it with your team instantly.' },
      ],
    },
    steps: [
      {
        number: '01',
        title: 'Click the Userplane extension icon in Chrome',
        description:
          'Open any web page and click the Userplane icon in your browser toolbar. The recorder starts instantly -- no configuration, no login screens, no setup wizards.',
        image: 'https://placehold.co/400x220/f8f8f8/cccccc?text=Step+01',
      },
      {
        number: '02',
        title: 'Record your screen with automatic technical capture',
        description:
          'Walk through the issue on screen while Userplane silently captures console logs, network requests, and browser metadata in the background. Everything your engineering team needs is recorded automatically.',
        image: 'https://placehold.co/400x220/f8f8f8/cccccc?text=Step+02',
      },
      {
        number: '03',
        title: 'Share the recording with your support team instantly',
        description:
          'Stop the recording and get a shareable link immediately. Recordings can be linked to support conversations so your team has full context without a single follow-up question.',
        image: 'https://placehold.co/400x220/f8f8f8/cccccc?text=Step+03',
      },
    ],
  },
  features: [
    {
      number: '01',
      title: 'One-click browser capture',
      description:
        'The Userplane extension sits in your Chrome toolbar, ready to record on any web page. There is no setup, no project configuration, and no SDK to install -- click the icon and start capturing. It works everywhere the browser works.',
      tagline: 'Zero-friction recording',
      capabilities: [
        'Single-click recording from toolbar',
        'Works on any web page',
        'No SDK or code changes required',
        'Lightweight browser extension',
      ],
      image: 'https://placehold.co/864x540/f8f8f8/cccccc?text=One-click+browser+capture',
    },
    {
      number: '02',
      title: 'Automatic technical context',
      description:
        'While you record, Userplane captures console logs, network requests, and browser metadata in the background. Your engineering team gets a complete technical snapshot without anyone opening DevTools.',
      tagline: 'Full-stack visibility',
      capabilities: [
        'Console logs & errors',
        'Network request capture',
        'Browser & OS metadata',
        'Automatic background collection',
      ],
      image: 'https://placehold.co/864x540/f8f8f8/cccccc?text=Automatic+technical+context',
    },
    {
      number: '03',
      title: 'Instant sharing',
      description:
        'Every recording generates a shareable link the moment you stop capturing. Link recordings to support conversations, paste them into tickets, or send them directly to engineering -- context travels with the recording.',
      tagline: 'Share in seconds',
      capabilities: [
        'Shareable link on every recording',
        'Link to support conversations',
        'No file uploads or downloads',
        'Instant availability after capture',
      ],
      image: 'https://placehold.co/864x540/f8f8f8/cccccc?text=Instant+sharing',
    },
  ],
});
