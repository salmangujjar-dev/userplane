import { TALLY_COMPLIANCE_FORM_URL } from './contact';
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
  support: getMarketingUrl('/support'),
} as const;

/**
 * Helper to get blog post URL
 */
export const getBlogPostUrl = (slug: string): string => {
  return getMarketingUrl(`/blog/${slug}`);
};

/**
 * Helper to get support topic URL
 */
export const getSupportTopicUrl = (topicSlug: string): string => {
  return getMarketingUrl(`/support/${topicSlug}`);
};

/**
 * Helper to get support article URL
 */
export const getSupportArticleUrl = (topicSlug: string, articleSlug: string): string => {
  return getMarketingUrl(`/support/${topicSlug}/${articleSlug}`);
};

/**
 * Footer navigation links
 */
export const FOOTER_LINKS = {
  product: [
    { label: 'Features', href: NAV_LINKS.features },
    { label: 'Pricing', href: NAV_LINKS.pricing },
    { label: 'Integration', href: NAV_LINKS.integrations },
  ],
  company: [
    { label: 'Blog', href: NAV_LINKS.blog },
    { label: 'Roadmap', href: NAV_LINKS.roadmap },
    { label: 'Support', href: NAV_LINKS.support },
  ],
  legal: [
    { label: 'Privacy Policy', href: getMarketingUrl('/privacy') },
    { label: 'Terms of Service', href: getMarketingUrl('/terms') },
    { label: 'Compliance Request', href: TALLY_COMPLIANCE_FORM_URL },
  ],
} as const;
