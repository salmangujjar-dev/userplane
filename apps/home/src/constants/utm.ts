type UTMSource = 'userplane.io';

type UTMMedium = 'homepage' | 'pricing' | 'framework' | 'integration' | 'role';

// Static listing campaigns + (string & {}) to accept dynamic page slugs
// while preserving autocomplete for the known values.
type UTMCampaign =
  | 'home'
  | 'header'
  | 'pricing'
  | 'frameworks-listing'
  | 'integrations-listing'
  | 'roles-listing'
  | (string & {});

type UTMContent =
  | 'hero-primary'
  | 'hero-secondary'
  | 'cta-primary'
  | 'cta-secondary'
  | 'header-cta'
  | 'pricing-card'
  | 'plan-enterprise'
  | 'plan-card'
  | 'compare-enterprise'
  | 'compare-card';

export interface UTMParams {
  utm_source: UTMSource;
  utm_medium: UTMMedium;
  utm_campaign: UTMCampaign;
  utm_content: UTMContent;
}

/**
 * Append UTM query parameters to a URL.
 * Only tags absolute URLs (skips internal paths like `/demo`).
 * Handles URLs that already have query strings.
 */
export function withUTM(url: string, params: UTMParams): string {
  if (!url.startsWith('http')) return url;

  const parsed = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    if (!parsed.searchParams.has(key)) {
      parsed.searchParams.set(key, value);
    }
  }
  return parsed.toString();
}

/**
 * Build standard UTM params with `utm_source=userplane.io`.
 */
export function buildUTM(medium: UTMMedium, campaign: UTMCampaign, content: UTMContent): UTMParams {
  return {
    utm_source: 'userplane.io',
    utm_medium: medium,
    utm_campaign: campaign,
    utm_content: content,
  };
}
