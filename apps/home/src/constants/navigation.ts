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
  solutions: getMarketingUrl('/for'),
  integrations: getMarketingUrl('/integrations'),
  frameworks: getMarketingUrl('/frameworks'),
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
