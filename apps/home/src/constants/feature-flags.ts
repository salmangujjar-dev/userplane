/**
 * Feature flags configuration
 * Controls feature availability and behavior across the application
 */

/**
 * Early access enabled flag
 * When true: pricing links point to dedicated /pricing page
 * When false: pricing links use anchor link /#pricing on homepage
 */
export const earlyAccessEnabled = true;

/**
 * Get pricing URL based on early access flag
 * Returns /pricing if early access is enabled, otherwise /#pricing
 */
export const getPricingUrl = (): string => {
  return earlyAccessEnabled ? '/#pricing' : '/pricing';
};
