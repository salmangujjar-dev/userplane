/**
 * Utility functions for workspace provisioning
 * Helper functions for extracting, deriving, and formatting data
 */

/**
 * Extract hostname from URL
 * Accepts any valid URL format and extracts the hostname
 *
 * @example
 * extractHostname("https://example.com/path?query=1") → "example.com"
 * extractHostname("http://sub.example.com:3000/path") → "sub.example.com"
 * extractHostname("https://app.example.com") → "app.example.com"
 */
export function extractHostname(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch (error) {
    throw new Error(`Invalid URL format: ${url}`);
  }
}

/**
 * Extract URL without query parameters
 * Keeps protocol, hostname, port, and path but removes query string and hash
 *
 * @example
 * removeQueryParams("https://example.com/path?query=1") → "https://example.com/path"
 * removeQueryParams("https://example.com/path?a=1&b=2#hash") → "https://example.com/path"
 * removeQueryParams("https://example.com") → "https://example.com"
 */
export function removeQueryParams(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch (error) {
    throw new Error(`Invalid URL format: ${url}`);
  }
}

/**
 * Derive workspace name from domain
 *
 * @example
 * deriveWorkspaceName("example.com") → "Example"
 * deriveWorkspaceName("my-startup.io") → "My Startup"
 */
export function deriveWorkspaceName(domain: string): string {
  const baseName = domain.split('.')[0];
  if (!baseName) {
    return 'Workspace';
  }
  return baseName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate favicon URL using Google Favicon API
 *
 * @param domain - Domain name
 * @param size - Icon size (default: 128)
 * @returns Favicon URL
 */
export function getFaviconAPIURI(domain: string, size: number = 128): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

/**
 * Convert string to URL-safe slug
 *
 * @example
 * slugify("My Startup") → "my-startup"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
