import { getMarketingUrl } from './urls';

/**
 * Navigation link configuration
 * Includes aria-labels for accessibility compliance
 */

/**
 * Logo link configuration
 * Used in Logo component when href is provided
 */
export const LOGO_LINK = {
  ariaLabel: 'Go to Userplane homepage',
} as const;

/**
 * Main navigation links
 */
export const NAV_LINKS = {
  home: getMarketingUrl('/'),
  features: getMarketingUrl('/#features'),
  pricing: getMarketingUrl('/pricing'),
  integrations: getMarketingUrl('/#integrations'),
  roadmap: getMarketingUrl('/roadmap'),
  blog: getMarketingUrl('/blog'),
  help: getMarketingUrl('/help'),
} as const;

/**
 * Helper to get blog post URL
 */
export const getBlogPostUrl = (slug: string): string => {
  return getMarketingUrl(`/blog/${slug}`);
};

/**
 * Helper to get help topic URL
 */
export const getHelpTopicUrl = (topicSlug: string): string => {
  return getMarketingUrl(`/help/${topicSlug}`);
};

/**
 * Helper to get help article URL
 */
export const getHelpArticleUrl = (topicSlug: string, articleSlug: string): string => {
  return getMarketingUrl(`/help/${topicSlug}/${articleSlug}`);
};
