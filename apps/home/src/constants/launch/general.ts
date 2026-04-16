import type {
  ButtonConfig,
  FeatureData,
  GradientConfig,
  IntegrationHeadline,
  ResourceLink,
} from '@/types/integrations';

import { TALLY_SALES_FORM_URL } from '../contact';
import {
  DOCS_DEVELOPER_INSTALLATION,
  DOCS_HELPDESK_SETUP,
  DOCS_HOME,
  DOCS_RECORDING_REQUESTING,
  DOCS_SENSITIVE_DATA_REDACTION,
} from '../integrations/links';
import { getLaunchFeatureUrl, getLaunchHeroUrl } from '../integrations/media';
import { SIGNUP_URL } from '../onboarding';

// ── Gradient ──

export const LAUNCH_GRADIENT: GradientConfig = {
  stops: [
    'rgba(59, 130, 246, 0.1)',
    'rgba(16, 185, 129, 0.1)',
    'rgba(139, 92, 246, 0.1)',
    'rgba(236, 72, 153, 0.1)',
  ],
};

// ── Hero ──

export const LAUNCH_HERO: {
  headline: IntegrationHeadline;
  description: string[];
  primaryCTA: ButtonConfig;
  secondaryCTA: ButtonConfig;
  screenshot: {
    src: string;
    srcSet: string;
    sizes: string;
    width: number;
    height: number;
    alt: string;
  };
} = {
  headline: {
    lines: ['Resolve support issues', 'without the back-and-forth'],
    highlights: [
      { wordIndex: 1, color: 'blue' },
      { wordIndex: 2, color: 'blue' },
    ],
  },
  description: [
    'Send a link to your customer. Get back a complete replay with console logs, network requests, and session details.',
  ],
  primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
  secondaryCTA: { text: 'See Demo', href: '/demo' },
  screenshot: {
    src: getLaunchHeroUrl('launch/general/hero.png'),
    srcSet: [
      `${getLaunchHeroUrl('launch/general/hero.png', 480)} 480w`,
      `${getLaunchHeroUrl('launch/general/hero.png', 768)} 768w`,
      `${getLaunchHeroUrl('launch/general/hero.png', 1280)} 1280w`,
      `${getLaunchHeroUrl('launch/general/hero.png', 1440)} 1440w`,
    ].join(', '),
    sizes: '(max-width: 1024px) 100vw, 52vw',
    width: 1440,
    height: 900,
    alt: 'Userplane screen recording dashboard',
  },
};

// ── Logos ──

export const LAUNCH_LOGOS_LABEL = 'Works with the tools you already use';

// ── Features ──

export const LAUNCH_FEATURES: FeatureData[] = [
  {
    number: '01',
    title: 'Recording, logs, and errors',
    description:
      'Share a recording link and get logs, network, and user steps—so your team can debug and resolve issues faster',
    tagline: 'Everything in one replay',
    capabilities: [
      'Surface console logs & errors',
      'Capture network requests',
      'Access application state',
      'Follow timestamped user actions',
    ],
    image: getLaunchFeatureUrl('launch/general/general-context.png'),
    learnMoreHref: DOCS_RECORDING_REQUESTING,
  },
  {
    number: '02',
    title: 'Built into your help desk',
    description:
      'Userplane lives inside Slack, Intercom, and Zendesk. Request recordings and receive replays — no context switch required.',
    tagline: 'Native integrations',
    capabilities: [
      'Slack slash commands & mentions',
      'Intercom Messenger app',
      'Zendesk sidebar app',
      'Chrome Extension for any tool',
    ],
    image: getLaunchFeatureUrl('launch/general/general-integration.png'),
    learnMoreHref: '/integrations',
  },
  {
    number: '03',
    title: 'Privacy-first by design',
    description:
      "Compliant by default. Define what's recorded, exclude sensitive data, and give your team clean, usable context.",
    tagline: 'Built for trust & compliance',
    capabilities: [
      'Automatic PII redaction',
      'Field-level blurring',
      'GDPR & CCPA compliant',
      'Customer consent controls',
    ],
    image: getLaunchFeatureUrl('launch/general/general-privacy.png'),
    learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
  },
];

// ── Resources ──

export const LAUNCH_RESOURCES: {
  label: string;
  headline: string;
  links: ResourceLink[];
  footerLinks: { text: string; href: string; external?: boolean }[];
} = {
  label: 'Resources',
  headline: 'Get started',
  links: [
    {
      label: 'Quickstart',
      title: 'Getting Started with Userplane',
      description:
        'Set up Userplane in your workspace and send your first recording request in minutes.',
      href: DOCS_HELPDESK_SETUP,
    },
    {
      label: 'Recording',
      title: 'How Screen Recording Works',
      description:
        'Learn how recordings capture console logs, network requests, and session metadata automatically.',
      href: DOCS_RECORDING_REQUESTING,
    },
    {
      label: 'Developer',
      title: 'Developer Installation Guide',
      description:
        'Technical guide for installing the Userplane SDK and configuring it for your application.',
      href: DOCS_DEVELOPER_INSTALLATION,
    },
  ],
  footerLinks: [
    { text: 'View all integrations', href: '/integrations' },
    { text: 'See all docs', href: DOCS_HOME, external: true },
  ],
};

// ── Listing Badges ──

export const LAUNCH_LISTING_BADGES = [
  {
    name: 'Fazier',
    href: 'https://fazier.com',
    badge: {
      src: 'https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=featured&theme=neutral',
      alt: 'Fazier badge',
      width: 250,
      height: 54,
    },
  },
  {
    name: 'Twelve Tools',
    href: 'https://twelve.tools',
    badge: {
      src: 'https://twelve.tools/badge0-white.svg',
      alt: 'Featured on Twelve Tools',
      width: 200,
      height: 54,
    },
  },
  {
    name: 'Findly Tools',
    href: 'https://findly.tools/userplane?utm_source=userplane',
    badge: {
      src: 'https://findly.tools/badges/findly-tools-badge-light.svg',
      alt: 'Featured on Findly.tools',
      width: 175,
      height: 55,
    },
  },
  {
    name: 'Tool Fame',
    href: 'https://toolfame.com/item/userplane',
    badge: {
      src: 'https://toolfame.com/badge-light.svg',
      alt: 'Featured on toolfame.com',
      width: 180,
      height: 54,
    },
  },
  {
    name: 'TinyLaunch',
    href: 'https://tinylaunch.com',
    badge: {
      src: 'https://tinylaunch.com/tinylaunch_badge_live_now.svg',
      alt: 'TinyLaunch Badge',
      width: 202,
      height: 54,
    },
  },
  {
    name: 'PeerPush',
    href: 'https://peerpush.net/p/userplane',
    badge: {
      src: 'https://peerpush.net/p/userplane/badge.png',
      alt: 'Userplane badge',
      width: 230,
      height: 54,
    },
  },
  {
    name: 'Uneed',
    href: 'https://www.uneed.best/tool/userplane',
    badge: {
      src: 'https://www.uneed.best/EMBED3.png',
      alt: 'Uneed Embed Badge',
      width: 200,
      height: 54,
    },
  },
  {
    name: 'Neeed Directory',
    href: 'https://neeed.directory/products/userplane?utm_source=userplane',
    badge: {
      src: 'https://neeed.directory/badges/neeed-badge-light.svg',
      alt: 'Featured on neeed.directory',
      width: 139,
      height: 54,
    },
  },
  {
    name: 'Startup Fast',
    href: 'https://startupfa.st',
    badge: {
      src: 'https://startupfa.st/images/badges/powered-by-light.svg',
      alt: 'Powered by Startup Fast',
      width: 150,
      height: 44,
    },
  },
  {
    name: 'FoundrList',
    href: 'https://www.foundrlist.com/product/userplane?utm_source=badge&utm_medium=embed',
    badge: {
      src: 'https://www.foundrlist.com/api/badge/userplane',
      alt: 'Featured on FoundrList',
      width: 150,
      height: 48,
    },
  },
  {
    name: 'NextGen Tools',
    href: 'https://www.nxgntools.com/tools/userplane?utm_source=userplane',
    badge: {
      src: 'https://www.nxgntools.com/api/embed/userplane?type=LAUNCHING_SOON_ON&hideUpvotes=true',
      alt: 'Launching Soon on NextGen Tools',
      width: 200,
      height: 48,
    },
  },
  {
    name: 'Shipybara',
    href: 'https://shipybara.com/projects/userplane',
    badge: {
      src: 'https://shipybara.com/images/badges/shipybara-badge-light.svg',
      alt: 'Featured on Shipybara',
      width: 150,
      height: 54,
    },
  },
  {
    name: 'Unite List',
    href: 'https://unitelist.com',
    badge: {
      src: 'https://unitelist.com/assets/images/badge.png',
      alt: 'Unite List',
      width: 180,
      height: 54,
    },
  },
  {
    name: 'Dofollow Tools',
    href: 'https://dofollow.tools',
    badge: {
      src: 'https://dofollow.tools/badge/badge_transparent.svg',
      alt: 'Featured on Dofollow.Tools',
      width: 200,
      height: 54,
    },
  },
  {
    name: 'ToolDirs',
    href: 'https://tooldirs.com',
    badge: {
      src: 'https://tooldirs.com/badge/badge_transparent.svg',
      alt: 'Featured on ToolDirs',
      width: 200,
      height: 54,
    },
  },
  {
    name: 'TryLaunch',
    href: 'https://trylaunch.ai/launch/userplane',
    badge: {
      src: 'https://trylaunch.ai/badges/badge-color.png',
      alt: 'Featured on Launch',
      width: 180,
      height: 53,
    },
  },
  {
    name: 'LaunchIgniter',
    href: 'https://launchigniter.com/product/userplane?ref=badge-userplane',
    badge: {
      src: 'https://launchigniter.com/api/badge/userplane?theme=light',
      alt: 'Featured on LaunchIgniter',
      width: 212,
      height: 55,
    },
  },
];

// ── CTA ──

export const LAUNCH_CTA: {
  headline: IntegrationHeadline;
  description: string;
  primaryCTA: ButtonConfig;
  secondaryCTA: ButtonConfig;
} = {
  headline: {
    lines: ['Resolve issues faster', 'with complete context upfront'],
    highlights: [
      { wordIndex: 1, color: 'blue' },
      { wordIndex: 2, color: 'blue' },
      { wordIndex: 5, color: 'green' },
      { wordIndex: 6, color: 'green' },
    ],
  },
  description:
    'Send a link and get back a complete replay with logs, network data, and session details.',
  primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
  secondaryCTA: { text: 'Talk to a Human', href: TALLY_SALES_FORM_URL },
};
