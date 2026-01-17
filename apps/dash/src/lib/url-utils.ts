/**
 * URL utilities and favicon helpers
 * Core utils from contract package, dashboard-specific favicon logic here
 */

import {
  extractHostname,
  extractUrlFromString,
  getFaviconUrl,
  isValidUrl,
} from '@workspace/contract';

export { extractHostname, extractUrlFromString, getFaviconUrl, isValidUrl };

/**
 * Format domain URL for display with path highlighting
 * Returns an object with domain and path parts for flexible rendering
 */
export function formatDomainUrl(domainUrl: string): {
  domain: string;
  path: string | null;
  hasPath: boolean;
} {
  if (domainUrl.includes('/')) {
    const parts = domainUrl.split('/');
    return {
      domain: parts[0] + '/',
      path: parts.slice(1).join('/'),
      hasPath: true,
    };
  }
  return {
    domain: domainUrl,
    path: null,
    hasPath: false,
  };
}

/**
 * Checks if a favicon from Google's API is the default globe icon
 * Google returns a 16x16 default globe when no real favicon exists
 */
export function checkIfDefaultFavicon(
  hostname: string,
  requestedSize: number = 64
): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = getFaviconUrl(hostname, requestedSize);

    img.onload = function () {
      const naturalWidth = (this as HTMLImageElement).naturalWidth;
      const naturalHeight = (this as HTMLImageElement).naturalHeight;

      // Google returns 16x16 default globe when larger size is requested and favicon doesn't exist
      if (naturalWidth === 16 && naturalHeight === 16 && requestedSize > 16) {
        resolve(true);
      } else if (naturalWidth <= 1 || naturalHeight <= 1) {
        resolve(true);
      } else {
        resolve(false);
      }
    };

    img.onerror = function () {
      resolve(true);
    };
  });
}

/**
 * Gets favicon URL for a given text/URL using Google's favicon API
 * Returns null if URL is invalid or favicon is default globe
 */
export async function getFaviconForUrl(text: string): Promise<string | null> {
  const extractedUrl = extractUrlFromString(text);
  if (!extractedUrl || !isValidUrl(extractedUrl)) {
    return null;
  }

  const hostname = extractHostname(extractedUrl);
  if (!hostname) {
    return null;
  }

  const isDefault = await checkIfDefaultFavicon(hostname, 64);
  if (isDefault) {
    return null;
  }

  return getFaviconUrl(hostname, 64);
}
