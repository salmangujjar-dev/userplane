/**
 * Centralized UI copy for shared components and pages
 */

/**
 * 404 Not Found page copy
 */
export const NOT_FOUND_COPY = {
  title: '404',
  heading: 'Page not found',
  subtitle: "The page you're looking for doesn't exist or may have been moved.",
} as const;

/**
 * Company name used across apps
 */
export const COMPANY_NAME = 'Userplane' as const;

/**
 * Website URL
 * Also used in:
 * - /content/legal/terms.md
 *
 * If changed, manually update legal documents as well.
 */
export const WEBSITE_URL = 'https://userplane.io' as const;

/**
 * Contact/support email (raw)
 * Also used in:
 * - /content/legal/terms.md
 * - /content/legal/privacy.md
 *
 * If changed, manually update legal documents as well.
 */
export const SUPPORT_EMAIL = 'support@mail.userplane.io' as const;

/**
 * Contact email (mailto link)
 * Use this for href attributes in links
 */
export const SUPPORT_EMAIL_MAILTO = `mailto:${SUPPORT_EMAIL}` as const;
