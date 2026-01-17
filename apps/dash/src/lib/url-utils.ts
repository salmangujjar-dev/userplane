import validator from 'validator';

/**
 * Map of domain patterns to local preview icons
 * Used for known services to provide faster icon loading
 */
export const DOMAIN_TO_ICON_MAP: Record<string, string> = {
  asana: '/preview/asana.webp',
  clickup: '/preview/clickup.webp',
  crisp: '/preview/crisp.webp',
  discord: '/preview/discord.webp',
  freshchat: '/preview/freshchat.webp',
  freshdesk: '/preview/freshdesk.webp',
  front: '/preview/front.webp',
  happyfox: '/preview/happyfox.webp',
  helpscout: '/preview/helpscout.webp',
  hiver: '/preview/hiver.webp',
  hubspot: '/preview/hubspot.webp',
  intercom: '/preview/intercom.webp',
  jira: '/preview/jira.webp',
  atlassian: '/preview/jira.webp',
  linear: '/preview/linear.webp',
  make: '/preview/make.webp',
  n8n: '/preview/n8n.webp',
  notion: '/preview/notion.webp',
  plain: '/preview/plain.webp',
  pylon: '/preview/pylon.webp',
  salesforce: '/preview/salesforce.webp',
  sentry: '/preview/sentry.webp',
  slack: '/preview/slack.webp',
  talkdesk: '/preview/talkdesk.webp',
  zapier: '/preview/zapier.webp',
  zendesk: '/preview/zendesk.webp',
  zoho: '/preview/zoho.webp',
};

/**
 * Extracts a URL from a string that may contain mixed content
 * Returns the first valid URL found or null
 */
export function extractUrlFromString(text: string): string | null {
  if (!text || text.trim() === '') return null;

  // Try to parse as URL directly first
  try {
    const url = new URL(text);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return text;
    }
  } catch {
    // Not a direct URL, try to find one in the text
  }

  // Match URLs in text using a robust pattern
  const urlPattern =
    /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;
  const match = text.match(urlPattern);

  if (match && match.length > 0) {
    return match[0];
  }

  return null;
}

/**
 * Checks if a string is a valid URL
 */
export function isValidUrl(text: string): boolean {
  if (!text || text.trim() === '') return false;

  return validator.isURL(text, {
    require_protocol: true,
    require_valid_protocol: true,
    protocols: ['http', 'https'],
    require_host: true,
    require_tld: false, // Allow localhost
  });
}

/**
 * Extracts the domain from a URL string
 */
export function extractDomainFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * Extracts the main domain name from a hostname
 * Example: "app.github.com" -> "github"
 * Example: "github.com" -> "github"
 */
export function extractMainDomain(hostname: string): string | null {
  if (!hostname) return null;

  const parts = hostname.split('.');

  // For hostnames with 2+ parts, get the second-to-last part
  // e.g., "app.github.com" -> "github", "github.com" -> "github"
  if (parts.length >= 2) {
    return parts[parts.length - 2].toLowerCase();
  }

  // For single-part hostnames (e.g., "localhost")
  return parts[0].toLowerCase();
}

/**
 * Gets the local icon path for a known domain
 */
export function getLocalIconForDomain(hostname: string): string | null {
  const mainDomain = extractMainDomain(hostname);
  if (!mainDomain) return null;

  return DOMAIN_TO_ICON_MAP[mainDomain] || null;
}

/**
 * Generates Google Favicon API URL for a domain
 */
export function getGoogleFaviconUrl(hostname: string, size: number = 64): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=${size}`;
}

interface FaviconCheckResult {
  isDefault: boolean;
  reason?: string;
}

/**
 * Checks if a favicon is the default globe icon
 * Google returns a default globe when no favicon is available
 */
export function checkIfDefaultFavicon(
  hostname: string,
  requestedSize: number = 64
): Promise<FaviconCheckResult> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = getGoogleFaviconUrl(hostname, requestedSize);

    img.onload = function () {
      const naturalWidth = (this as HTMLImageElement).naturalWidth;
      const naturalHeight = (this as HTMLImageElement).naturalHeight;

      // Google returns 16x16 default globe when larger size is requested and favicon doesn't exist
      if (naturalWidth === 16 && naturalHeight === 16 && requestedSize > 16) {
        resolve({
          isDefault: true,
          reason: 'Size mismatch - got 16x16 when requesting larger',
        });
      } else if (naturalWidth <= 1 || naturalHeight <= 1) {
        resolve({
          isDefault: true,
          reason: 'Transparent 1x1 pixel',
        });
      } else {
        resolve({ isDefault: false });
      }
    };

    img.onerror = function () {
      resolve({ isDefault: true, reason: 'Load error' });
    };
  });
}

interface FaviconResult {
  url: string | null;
  isLocal: boolean;
  fallbackDomain: string | null;
}

/**
 * Gets the appropriate favicon URL for a given text/URL
 * Returns local icon if available, otherwise checks Google's API
 */
export async function getFaviconForUrl(text: string): Promise<FaviconResult> {
  const extractedUrl = extractUrlFromString(text);

  if (!extractedUrl || !isValidUrl(extractedUrl)) {
    return { url: null, isLocal: false, fallbackDomain: null };
  }

  const hostname = extractDomainFromUrl(extractedUrl);
  if (!hostname) {
    return { url: null, isLocal: false, fallbackDomain: null };
  }

  // Try local icon first
  const localIcon = getLocalIconForDomain(hostname);
  if (localIcon) {
    return { url: localIcon, isLocal: true, fallbackDomain: hostname };
  }

  // Check if Google has a real favicon
  const faviconCheck = await checkIfDefaultFavicon(hostname, 64);

  if (faviconCheck.isDefault) {
    // No real favicon available
    return { url: null, isLocal: false, fallbackDomain: null };
  }

  // Real favicon found
  return {
    url: getGoogleFaviconUrl(hostname, 64),
    isLocal: false,
    fallbackDomain: null,
  };
}
