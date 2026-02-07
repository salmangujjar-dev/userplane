import { TALLY_COMPLIANCE_FORM_URL } from './contact';
import { NAV_LINKS } from './navigation';
import { getMarketingUrl } from './urls';

/**
 * Footer link interface
 */
export interface FooterLink {
  label: string;
  href: string;
}

/**
 * Footer copyright text
 */
export const FOOTER_COPYRIGHT = 'Userplane. All rights reserved.';

/**
 * Footer navigation links organized by section
 */
export const FOOTER_LINKS = {
  product: [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'FAQ', href: '/#faq' },
  ],
  company: [
    { label: 'Blog', href: NAV_LINKS.blog },
    { label: 'Roadmap', href: NAV_LINKS.roadmap },
    { label: 'Help Center', href: NAV_LINKS.help },
  ],
  legal: [
    { label: 'Privacy Policy', href: getMarketingUrl('/privacy') },
    { label: 'Terms of Service', href: getMarketingUrl('/terms') },
    { label: 'Compliance Request', href: TALLY_COMPLIANCE_FORM_URL },
  ],
} as const;
