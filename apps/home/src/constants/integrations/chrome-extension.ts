import { TALLY_SALES_FORM_URL } from '../contact';
import { SIGNUP_URL } from '../onboarding';
import { defineIntegration } from './defaults';
import {
  DOCS_CHROME_EXTENSION,
  DOCS_HELPDESK_SETUP,
  DOCS_RECORDING_REQUESTING,
  DOCS_SENSITIVE_DATA_REDACTION,
} from './links';
import { getFeatureUrl, getHeroUrl, getIconUrl } from './media';

export const chromeExtensionConfig = defineIntegration({
  slug: 'chrome-extension',
  name: 'Chrome Extension',
  shortName: 'Chrome',
  url: 'https://chrome.google.com/webstore',
  icon: { src: getIconUrl('integrations/chrome.webp'), alt: 'Chrome' },
  gradient: {
    stops: [
      'rgba(66, 133, 244, 0.1)',
      'rgba(52, 168, 83, 0.1)',
      'rgba(251, 188, 5, 0.1)',
      'rgba(234, 67, 53, 0.1)',
    ],
  },
  seo: {
    title: 'Chrome Extension for Requesting Screen Recordings | Userplane',
    description:
      'Send recording links to customers right from Chrome. Get back replays with console logs, network traces, and session data for your support team to resolve issues faster.',
    keywords:
      'chrome extension screen recording, browser screen recording, chrome screen capture, screen recording extension, userplane, chrome devtools recording, browser capture tool',
    ogImage: '/images/preview/og-chrome-extension.webp',
  },
  hero: {
    headline: {
      lines: ['Screen Recording Links', 'for Support Teams'],
      highlights: [{ wordIndex: 4, color: 'yellow' }],
      icons: [
        {
          wordIndex: 4,
          src: getIconUrl('integrations/chrome.webp'),
          alt: 'Chrome',
        },
      ],
    },
    description: [
      'Create and share recording links right within Chrome.',
      'Give your support team the context they need to close tickets faster.',
    ],
    preview: {
      src: getHeroUrl('microsites/chrome-extension/hero.png'),
      alt: 'Userplane Chrome Extension recording a browser session',
    },
    marketplace: {
      label: 'Chrome Web Store',
      href: 'https://chromewebstore.google.com/detail/request-screen-recording/bgmbeifpcfepegcjhjdbocjbecpfmakm',
      icon: { src: getIconUrl('integrations/chrome.webp'), alt: 'Chrome' },
    },
  },
  features: [
    {
      number: '01',
      title: 'Send a link. Get a recording.',
      description:
        'The Userplane extension lives in your Chrome toolbar, letting you create and share recording links from any page. Click to generate a link and send it to your customer. No integration or setup required.',
      tagline: 'Zero-friction recording',
      capabilities: [
        'One-click recording links for your customers',
        'Works across any help desk, CRM, or internal tool',
        'No integration, setup or admin needed',
        'A browser extension that just works out of the box',
      ],
      image: getFeatureUrl('microsites/chrome-extension/chrome-extension-integration.png'),
      learnMoreHref: DOCS_HELPDESK_SETUP,
    },
    {
      number: '02',
      title: 'Automatic technical context',
      description:
        'Every recording link captures console logs, network activity, and session details for your support team to resolve issues faster. Your team gets a complete technical snapshot — without asking customers for details.',
      tagline: 'Built for debugging',
      capabilities: [
        'Capture console output and error traces',
        'Analyze network requests and session activity',
        'Access application state and environment details',
        "Follow the customer's journey step by step",
      ],
      image: getFeatureUrl('microsites/chrome-extension/chrome-extension-context.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Secure and private',
      description:
        'Userplane protects your customers by default. Sensitive data never leaves the browser. Control what gets recorded, and stay compliant while building trust with your customers.',
      tagline: 'Built for compliance',
      capabilities: [
        'Blur and mask confidential fields automatically',
        'Define element-level redaction and masking rules',
        'Give users control with built-in consent flows',
        'Meet GDPR and CCPA without any extra work',
      ],
      image: getFeatureUrl('microsites/chrome-extension/chrome-extension-privacy.png'),
      learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
    },
  ],
  resources: { seeAllHref: DOCS_CHROME_EXTENSION },
  cta: {
    headline: {
      lines: ['Request screen recordings', 'right within Chrome'],
      highlights: [
        // { wordIndex: 1, color: 'blue' },
        // { wordIndex: 2, color: 'blue' },
        { wordIndex: 5, color: 'yellow' },
      ],
      icons: [
        {
          wordIndex: 5,
          position: 'before',
          src: getIconUrl('integrations/chrome.webp'),
          alt: 'Chrome',
        },
      ],
    },
    description: "Send a recording link and get back a complete replay of the customer's issue.",
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'Talk to a Human', href: TALLY_SALES_FORM_URL },
  },
});
