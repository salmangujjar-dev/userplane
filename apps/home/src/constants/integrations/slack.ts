import { TALLY_SALES_FORM_URL } from '../contact';
import { SIGNUP_URL } from '../onboarding';
import { getDashUrl } from '../urls';
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
      'rgba(97, 31, 105, 0.1)',
      'rgba(224, 30, 90, 0.1)',
      'rgba(44, 169, 131, 0.1)',
      'rgba(54, 197, 240, 0.1)',
    ],
  },
  seo: {
    title: 'Slack Screen Recording Integration | Userplane',
    description:
      'Triage customer bugs within Slack. Every screen recording carries console logs, network data, and session activity.',
    keywords:
      'slack screen recording, slack bug reporting, slack customer support recording, slack integration, screen recording slack, userplane slack, slack support tool, slack issue reporting',
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
      'Userplane brings screen recordings into Slack. Request recordings and capture logs right where your team works.',
    ],
    preview: {
      src: getHeroUrl('microsites/integrations/slack/hero.png'),
      alt: 'Userplane screen recording posted in a Slack thread',
    },
    marketplace: {
      label: 'Slack App Store',
      href: getDashUrl('/_/settings?tab=integrations'),
      icon: { src: getIconUrl('integrations/slack.webp'), alt: 'Slack' },
    },
  },
  features: [
    {
      number: '01',
      title: 'Works right inside Slack',
      description:
        'Userplane lives in your Slack support channels. Request recordings with a slash command or mention and receive replays without ever leaving Slack.',
      tagline: 'Stay where work happens',
      capabilities: [
        'Stay fully inside Slack workflows',
        'Recordings linked to conversations',
        'Works in DMs and shared channels',
        'Capture issues without meetings',
      ],
      image: getFeatureUrl('microsites/integrations/slack/slack-thread-recording.png'),
      learnMoreHref: DOCS_HELPDESK_SETUP,
    },
    {
      number: '02',
      title: 'Capture everything your team needs',
      description:
        'Capture console logs, network activity, and user steps in one recording — tied to the original thread for faster, clearer debugging.',
      tagline: 'Full technical context',
      capabilities: [
        'Capture network requests and logs',
        'Trace every network request made',
        'Step by step user replay included',
        'All events on a single timeline',
      ],
      image: getFeatureUrl('microsites/integrations/slack/slack-console-logs.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Privacy controls built in',
      description:
        "Automatically scrub sensitive data before recordings leave the browser. Blur sensitive data, control what's captured, and meet compliance standards without additional work.",
      tagline: 'Private by default',
      capabilities: [
        'Blur sensitive fields automatically',
        'Users stay in control of recordings',
        'Manage capture rules per domain',
        'Built in compliance for GDPR/CCPA',
      ],
      image: getFeatureUrl('microsites/integrations/slack/slack-data-redaction.png'),
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
