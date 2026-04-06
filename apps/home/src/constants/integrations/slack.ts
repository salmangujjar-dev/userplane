import { TALLY_SALES_FORM_URL } from '../contact';
import { SIGNUP_URL } from '../onboarding';
import { defineIntegration } from './defaults';
import {
  DOCS_HELPDESK_SETUP,
  DOCS_RECORDING_REQUESTING,
  DOCS_SENSITIVE_DATA_REDACTION,
  DOCS_SLACK,
} from './links';
import { getFeatureUrl, getHeroUrl, getIconUrl } from './media';

export const slackConfig = defineIntegration({
  slug: 'slack',
  name: 'Slack',
  url: 'https://slack.com',
  icon: { src: getIconUrl('integrations/slack.webp'), alt: 'Slack' },
  gradient: {
    stops: [
      'rgba(97, 31, 105, 0.2)',
      'rgba(224, 30, 90, 0.2)',
      'rgba(44, 169, 131, 0.2)',
      'rgba(54, 197, 240, 0.2)',
    ],
  },
  seo: {
    title: 'Slack Screen Recording Integration | Userplane',
    description:
      'Request and receive screen recordings within Slack. Capture console logs, network requests, and session replays. No context switch needed.',
    keywords:
      'slack screen recording, slack bug reporting, slack customer support recording, slack integration, screen recording slack, userplane slack, slack support tool, slack issue reporting',
    ogImage: '/images/preview/og-slack.webp',
  },
  hero: {
    headline: {
      lines: ['Request screen recordings', 'right from Slack'],
      highlights: [{ wordIndex: 5, color: 'purple' }],
      icons: [
        {
          wordIndex: 5,
          src: getIconUrl('integrations/slack.webp'),
          alt: 'Slack',
        },
      ],
    },
    description: [
      'Userplane brings screen recordings into Slack.',
      'Request recordings and capture logs right where your team works.',
    ],
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'See Demo', href: '/demo' },
    preview: {
      src: getHeroUrl('microsites/slack/hero.png'),
      alt: 'Userplane screen recording posted in a Slack thread',
    },
  },
  features: [
    {
      number: '01',
      title: 'Works right inside Slack',
      description:
        'Userplane lives in your Slack support channels. Request recordings from your customers with a slash command or mention, and receive replays without ever leaving Slack.',
      tagline: 'Stay where work happens',
      capabilities: [
        'Slash command and mention to request recordings',
        'Receive recordings referencing the originating thread',
        'Works in DMs, public, private, and external channels',
        'Capture issues without scheduling a meeting',
      ],
      image: getFeatureUrl('microsites/slack/slack-integration.png'),
      learnMoreHref: DOCS_HELPDESK_SETUP,
    },
    {
      number: '02',
      title: 'Capture everything your team needs',
      description:
        'Recordings include console errors, network activity, and user steps — linked to the exact thread where the issue was reported. So your team gets everything they need without a single follow-up question.',
      tagline: 'Full technical context',
      capabilities: [
        'Auto-capture console logs and network errors',
        'Trace network requests and response times',
        'Replay exactly what the user did step-by-step',
        'Review everything on a single timeline',
      ],
      image: getFeatureUrl('microsites/slack/slack-context.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Privacy controls built in',
      description:
        "Recordings are scrubbed of sensitive data before they ever leave the customer's browser. Automatically blur confidential fields, control what gets recorded, and stay compliant while building trust with your users.",
      tagline: 'Private by default',
      capabilities: [
        'Let customers control what gets recorded',
        'Blur and mask confidential fields automatically',
        'Customize exactly what gets recorded per domain',
        'Stay compliant with GDPR and CCPA out of the box',
      ],
      image: getFeatureUrl('microsites/slack/slack-privacy.png'),
      learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
    },
  ],
  resources: { seeAllHref: DOCS_SLACK },
  cta: {
    headline: {
      lines: ['Request screen recordings', 'right from Slack'],
      highlights: [
        // { wordIndex: 1, color: 'blue' },
        // { wordIndex: 2, color: 'blue' },
        { wordIndex: 5, color: 'purple' },
      ],
      icons: [
        {
          wordIndex: 5,
          src: getIconUrl('integrations/slack.webp'),
          alt: 'Slack',
        },
      ],
    },
    description:
      "Request recordings from any channel and get back a complete replay of the customer's issue.",
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'Talk to a Human', href: TALLY_SALES_FORM_URL },
  },
});
