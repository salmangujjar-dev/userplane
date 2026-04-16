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
      'Resolve customer bugs without leaving Chrome. Send a recording link; the replay returns with console, network, and session activity.',
    keywords:
      'chrome extension screen recording, browser screen recording, chrome screen capture, screen recording extension, userplane, chrome devtools recording, browser capture tool',
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
      'Share recording links right within Chrome. Capture logs, network activity, and user context to speed up ticket resolution.',
    ],
    preview: {
      src: getHeroUrl('microsites/integrations/chrome-extension/hero.png'),
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
        'Userplane lives in your Chrome toolbar. Create and send recording links from any page. No integration required.',
      tagline: 'Zero-friction recording',
      capabilities: [
        'Instantly create recording links',
        'Works across any site or web app',
        'No setup or integration required',
        'Always available in your browser',
      ],
      image: getFeatureUrl(
        'microsites/integrations/chrome-extension/chrome-extension-recording-link.png'
      ),
      learnMoreHref: DOCS_HELPDESK_SETUP,
    },
    {
      number: '02',
      title: 'Automatic technical context',
      description:
        'Every recording link includes logs, network activity, and session data—so your team can debug faster without asking customers for more details.',
      tagline: 'Built for debugging',
      capabilities: [
        'Collect console output and logs',
        'Full network trace for each issue',
        'Session details always included',
        'Follow user steps from start to end',
      ],
      image: getFeatureUrl(
        'microsites/integrations/chrome-extension/chrome-extension-console-logs.png'
      ),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Secure and private',
      description:
        'Userplane protects your customers by default. Control what gets recorded, and stay compliant without additional effort.',
      tagline: 'Built for compliance',
      capabilities: [
        'Mask confidential data fields',
        'Define element level redaction',
        'Built in consent flows for users',
        'Comply with GDPR and CCPA',
      ],
      image: getFeatureUrl(
        'microsites/integrations/chrome-extension/chrome-extension-data-redaction.png'
      ),
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
