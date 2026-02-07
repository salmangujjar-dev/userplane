import type { HighlightConfig } from './types';

/**
 * Support topic definition
 * Each topic maps to a directory under content/support/{slug}/
 */
export interface SupportTopic {
  slug: string;
  title: string;
  subtitle: string;
  highlights: HighlightConfig[];
}

/**
 * Support page heading
 */
export const SUPPORT_HEADING = {
  title: 'Help Center',
  subtitle: 'Find answers, guides, and resources to get the most out of Userplane',
};

/**
 * Support heading highlights configuration
 * "Help" gets green highlight
 */
export const SUPPORT_HIGHLIGHTS: HighlightConfig[] = [{ wordIndex: 0, color: 'green' }];

/**
 * Support topics
 * Order determines display order on the support index page.
 * Each slug must match a directory name under content/support/.
 * highlights: which words in the title get a colored background.
 */
export const SUPPORT_TOPICS: SupportTopic[] = [
  {
    slug: 'getting-started',
    title: 'Getting Started',
    subtitle: 'Set up your account and send your first recording request',
    highlights: [{ wordIndex: 0, color: 'green' }],
  },
  {
    slug: 'recording',
    title: 'Screen Recording',
    subtitle: 'How recordings work, sharing, and playback',
    highlights: [{ wordIndex: 0, color: 'blue' }],
  },
  {
    slug: 'recording-links',
    title: 'Recording Links',
    subtitle: 'Customize and configure your recording links',
    highlights: [{ wordIndex: 0, color: 'green' }],
  },
  {
    slug: 'integrations',
    title: 'Integrations',
    subtitle: 'Connect Userplane with Intercom, Zendesk, and more',
    highlights: [{ wordIndex: 0, color: 'purple' }],
  },
  {
    slug: 'workspace',
    title: 'Workspace',
    subtitle: 'Configure and manage your Userplane workspace',
    highlights: [{ wordIndex: 0, color: 'green' }],
  },
  {
    slug: 'account',
    title: 'Account',
    subtitle: 'Configure and manage your Userplane account',
    highlights: [{ wordIndex: 0, color: 'purple' }],
  },
  {
    slug: 'billing',
    title: 'Billing & Usage',
    subtitle: 'Manage your billing and usage limits',
    highlights: [{ wordIndex: 0, color: 'blue' }],
  },
  {
    slug: 'support',
    title: 'Support',
    subtitle: 'Get help from our support team',
    highlights: [{ wordIndex: 0, color: 'green' }],
  },
  {
    slug: 'developer-docs',
    title: 'Developer Docs',
    subtitle: 'Technical guides, APIs, and SDK references for developers',
    highlights: [{ wordIndex: 0, color: 'yellow' }],
  },
];

/**
 * Lookup a topic by its slug.
 * Returns undefined if no match is found.
 */
export function getTopicBySlug(slug: string): SupportTopic | undefined {
  return SUPPORT_TOPICS.find((t) => t.slug === slug);
}
