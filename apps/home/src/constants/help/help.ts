import type { HelpTopic } from '@/types/help';
import type { HighlightConfig } from '@/types/highlight';

import { getDocsUrl } from '../urls';

export type { HelpTopic };

/**
 * Help page heading
 */
export const HELP_HEADING = {
  title: 'Help Center',
  subtitle: 'Find answers, guides, and resources to get the most out of Userplane',
};

/**
 * Help heading highlights configuration
 * "Help" gets green highlight
 */
export const HELP_HIGHLIGHTS: HighlightConfig[] = [{ wordIndex: 0, color: 'green' }];

/**
 * Help topics
 * Order determines display order on the help index page.
 * Each href points to the corresponding docs.userplane.io page.
 * highlights: which words in the title get a colored background.
 */
export const HELP_TOPICS: HelpTopic[] = [
  {
    title: 'Getting Started',
    subtitle: 'Set up your account and send your first recording request',
    href: getDocsUrl('/quickstart'),
    highlights: [{ wordIndex: 0, color: 'green' }],
  },
  {
    title: 'Screen Recording',
    subtitle: 'How recordings work, sharing, and playback',
    href: getDocsUrl('/recording/requesting'),
    highlights: [{ wordIndex: 0, color: 'blue' }],
  },
  {
    title: 'Recording Links',
    subtitle: 'Customize and configure your recording links',
    href: getDocsUrl('/recording-links/overview'),
    highlights: [{ wordIndex: 0, color: 'green' }],
  },
  {
    title: 'Integrations',
    subtitle: 'Connect Userplane with Intercom, Zendesk, and more',
    href: getDocsUrl('/getting-started/helpdesk-setup'),
    highlights: [{ wordIndex: 0, color: 'purple' }],
  },
  {
    title: 'Workspace',
    subtitle: 'Configure and manage your Userplane workspace',
    href: getDocsUrl('/workspace/team-management'),
    highlights: [{ wordIndex: 0, color: 'green' }],
  },
  {
    title: 'Account',
    subtitle: 'Configure and manage your Userplane account',
    href: getDocsUrl('/account/profile'),
    highlights: [{ wordIndex: 0, color: 'purple' }],
  },
  {
    title: 'Billing & Usage',
    subtitle: 'Manage your billing and usage limits',
    href: getDocsUrl('/billing/overview'),
    highlights: [{ wordIndex: 0, color: 'blue' }],
  },
  {
    title: 'Support',
    subtitle: 'Get help from our support team',
    href: getDocsUrl('/support/contact'),
    highlights: [{ wordIndex: 0, color: 'green' }],
  },
  {
    title: 'Developer Docs',
    subtitle: 'Technical guides, APIs, and SDK references for developers',
    href: getDocsUrl('/developer/installation'),
    highlights: [{ wordIndex: 0, color: 'yellow' }],
  },
];
