import { CONTACT_EMAIL_MAILTO, TALLY_COMPLIANCE_FORM_URL } from './contact';
import { getPricingUrl } from './feature-flags';
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
  pricing: getMarketingUrl(getPricingUrl()),
  integrations: getMarketingUrl('/#integrations'),
  roadmap: getMarketingUrl('/roadmap'),
  blog: getMarketingUrl('/blog'),
} as const;

/**
 * Helper to get blog post URL
 */
export const getBlogPostUrl = (slug: string): string => {
  return getMarketingUrl(`/blog/${slug}`);
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
    { label: 'Support', href: CONTACT_EMAIL_MAILTO },
  ],
  legal: [
    { label: 'Privacy Policy', href: getMarketingUrl('/privacy') },
    { label: 'Terms of Service', href: getMarketingUrl('/terms') },
    { label: 'Compliance Request', href: TALLY_COMPLIANCE_FORM_URL },
  ],
} as const;
