interface UTMParams {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
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
export function buildUTM(medium: string, campaign: string, content: string): UTMParams {
  return {
    utm_source: 'userplane.io',
    utm_medium: medium,
    utm_campaign: campaign,
    utm_content: content,
  };
}
