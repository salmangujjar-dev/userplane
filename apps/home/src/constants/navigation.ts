/**
 * Navigation link configuration
 * Includes aria-labels for accessibility compliance
 */

/**
 * Logo link configuration
 * Used in Logo component when href is provided
 */
export const LOGO_LINK = {
  ariaLabel: 'Go to Subsignal homepage',
} as const;

/**
 * Footer navigation links
 */
export const FOOTER_LINKS = {
  product: [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Integration', href: '/#integrations' },
  ],
  company: [
    { label: 'Blog', href: '/blog' },
    { label: 'Roadmap', href: '/roadmap' },
    { label: 'Support', href: 'mailto:nick@subsignal.vc' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Compliance', href: '/' },
  ],
} as const;
