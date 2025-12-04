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
 * Clean and normalize URL for storage
 * Removes query parameters, hash fragments, and trailing slashes
 * Normalizes multiple consecutive slashes in paths
 * Keeps protocol, hostname, port, and path only
 *
 * @example
 * cleanUrl("https://example.com/") → "https://example.com"
 * cleanUrl("https://example.com/path/") → "https://example.com/path"
 * cleanUrl("https://example.com/test/////") → "https://example.com/test"
 * cleanUrl("https://example.com/path?query=1") → "https://example.com/path"
 * cleanUrl("https://example.com/path?a=1&b=2#hash") → "https://example.com/path"
 * cleanUrl("https://example.com:3000/path/") → "https://example.com:3000/path"
 * cleanUrl("https://example.com//path//to///page") → "https://example.com/path/to/page"
 */
export function cleanUrl(url: string): string {
  try {
    const parsed = new URL(url);
    let pathname = parsed.pathname;

    // Normalize multiple consecutive slashes to single slash
    pathname = pathname.replace(/\/+/g, '/');

    // Remove all trailing slashes
    pathname = pathname.replace(/\/+$/, '');

    // If pathname is empty, keep it empty (no trailing slash for root)
    const cleanedUrl = `${parsed.protocol}//${parsed.host}${pathname}`;

    return cleanedUrl;
  } catch (error) {
    throw new Error(`Invalid URL format: ${url}`);
  }
}

/**
 * Extract URL without query parameters
 * Legacy function - use cleanUrl() for new code
 * Keeps protocol, hostname, port, and path but removes query string and hash
 *
 * @deprecated Use cleanUrl() instead
 */
export function removeQueryParams(url: string): string {
  return cleanUrl(url);
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
 * Derive workspace name from user's name
 * Uses first name if available, otherwise falls back to "Workspace"
 *
 * @example
 * deriveWorkspaceNameFromUser("John Doe") → "John's workspace"
 * deriveWorkspaceNameFromUser("Jane") → "Jane's workspace"
 * deriveWorkspaceNameFromUser("") → "workspace"
 * deriveWorkspaceNameFromUser(null) → "workspace"
 */
export function deriveWorkspaceNameFromUser(userName: string | null | undefined): string {
  if (!userName || userName.trim() === '') {
    return 'workspace';
  }

  const firstName = userName.trim().split(/\s+/)[0];
  if (!firstName) {
    return 'workspace';
  }

  return `${firstName}'s workspace`;
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
