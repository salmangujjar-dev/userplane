import { SIGNUP_URL } from '../onboarding';
import { defineIntegration } from './_defaults';

export const slackConfig = defineIntegration({
  slug: 'slack',
  name: 'Slack',
  url: 'https://slack.com',
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
      'Request and receive screen recordings directly in Slack channels and threads. Capture console logs, network requests, and session replays without leaving Slack.',
    keywords:
      'slack screen recording, slack bug reporting, slack customer support recording, slack integration, screen recording slack, userplane slack, slack support tool, slack issue reporting',
    ogImage: '/images/preview/og-slack.webp',
  },
  hero: {
    headline: {
      lines: ['Screen recordings that', 'live inside'],
      accent: 'Slack',
    },
    description:
      'Userplane is the screen recording bot for Slack. Request recordings from any channel or thread, capture console logs and network data automatically, and get completed replays posted back where your team already works.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'See Demo', href: '/demo' },
    preview: {
      src: 'https://placehold.co/1440x800/f8f8f8/cccccc?text=Slack+Integration',
      alt: 'Userplane screen recording posted in a Slack thread',
    },
  },
  steps: {
    headline: {
      before: 'Userplane',
      segments: [
        { accent: 'captures', after: 'what your customer sees,' },
        { accent: 'posts', after: 'the recording to your thread, and gives you' },
        { accent: 'context', after: 'to resolve issues fast.' },
      ],
    },
    steps: [
      {
        number: '01',
        title: 'Request a recording from a channel or thread',
        description:
          'Use the Userplane bot in any Slack channel or thread to generate a recording link. Share it with your customer or teammate — no installs, extensions, or sign-ups required on their end.',
        image: 'https://placehold.co/400x220/f8f8f8/cccccc?text=Step+01',
      },
      {
        number: '02',
        title: 'Customer records their screen',
        description:
          'Your customer opens the link and records what went wrong. Console logs, network requests, and browser metadata are captured silently in the background while they show you the issue.',
        image: 'https://placehold.co/400x220/f8f8f8/cccccc?text=Step+02',
      },
      {
        number: '03',
        title: 'Recording posts back to the thread',
        description:
          'The Userplane bot posts the completed recording directly into the Slack thread where you requested it. Watch the replay with console errors, network failures, and a step-by-step action trail — all without leaving Slack.',
        image: 'https://placehold.co/400x220/f8f8f8/cccccc?text=Step+03',
      },
    ],
  },
  features: [
    {
      number: '01',
      title: 'Slack bot that lives in your channels',
      description:
        'The Userplane bot integrates directly into Slack. Request recordings with a slash command or bot mention, and receive completed replays posted back to the same thread. No tab switching, no external dashboards — everything stays in Slack.',
      tagline: 'Built for Slack',
      capabilities: [
        'Slash command and bot mention to request recordings',
        'Completed recordings posted to the originating thread',
        'Works in public channels, private channels, and DMs',
        'Unfurled recording previews with thumbnails',
      ],
      image: 'https://placehold.co/864x540/f8f8f8/cccccc?text=Slack+bot+integration',
    },
    {
      number: '02',
      title: 'Thread-linked recordings with full technical context',
      description:
        'Every recording is tied to the Slack thread where it was requested. Console errors, failed API calls, network timing, and browser metadata are captured automatically — giving your engineering team everything they need without a single follow-up question.',
      tagline: 'Full technical context',
      capabilities: [
        'Console logs and JavaScript errors',
        'Network request waterfall with response timing',
        'Browser, OS, and viewport metadata',
        'Timestamped trail of user actions',
      ],
      image: 'https://placehold.co/864x540/f8f8f8/cccccc?text=Thread-linked+recordings',
    },
    {
      number: '03',
      title: 'Privacy controls built in',
      description:
        "Recordings are scrubbed of sensitive data before they ever leave the customer's browser. Set up element-level redaction rules, enforce consent prompts, and stay compliant with GDPR and CCPA without extra configuration.",
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
