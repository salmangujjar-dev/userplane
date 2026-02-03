/**
 * Workspace utility functions
 * Helper functions for workspace name derivation and formatting
 */

import { getEmailDomain, isDisposableEmail } from '@workspace/shared';

/**
 * Check if a string is an IP address (IPv4 or IPv6)
 * Why: IP addresses don't make good workspace names, so we detect them separately
 * How: Uses regex patterns to match IPv4 and IPv6 formats
 */
function isIpAddress(hostname: string): boolean {
  // IPv4 pattern: matches dotted decimal notation
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 pattern: simplified check for colon-separated hex or brackets
  const ipv6Pattern = /^(\[?[\da-f:]+\]?)$/i;

  return ipv4Pattern.test(hostname) || ipv6Pattern.test(hostname) || hostname.includes(':');
}

/**
 * Derive workspace name from domain and user name with intelligent fallback
 * What: Determines the best workspace name by trying domain first, then user name
 * How: Parses domain as URL, extracts meaningful name, falls back to user's first name if domain is invalid/generic
 * Why: Handles invalid domains gracefully and provides best UX by prioritizing meaningful names
 *
 * @param domain - Optional domain or URL string (may be invalid)
 * @param userName - Optional user's full name
 * @returns A formatted workspace name
 *
 * @example
 * deriveWorkspaceName("example.com", "John Doe") → "Example"
 * deriveWorkspaceName("invalid!!domain", "John Doe") → "John's workspace"
 * deriveWorkspaceName("127.0.0.1", "Jane Smith") → "Jane's workspace"
 * deriveWorkspaceName("my-company.io", null) → "My Company"
 * deriveWorkspaceName("localhost", "Bob") → "Bob's workspace"
 * deriveWorkspaceName("localhost", null) → "Localhost"
 * deriveWorkspaceName(null, null) → "Userplane Workspace"
 */
export function deriveWorkspaceName(
  domain: string | null | undefined,
  userName: string | null | undefined
): string {
  let nameFromDomain: string | null = null;

  // Try to derive name from domain/URL
  if (domain && domain.trim() !== '') {
    try {
      const trimmedDomain = domain.trim();

      // Check for invalid characters before URL parsing
      // @ symbol (except in protocol) indicates username/password or malformed URL
      const domainPart = trimmedDomain.includes('://')
        ? trimmedDomain.split('://')[1]
        : trimmedDomain;

      if (domainPart?.includes('@')) {
        // Invalid domain format
        nameFromDomain = null;
      } else {
        // Add protocol if missing to ensure URL parsing works
        const urlString = trimmedDomain.includes('://')
          ? trimmedDomain
          : `https://${trimmedDomain}`;
        const url = new URL(urlString);
        const hostname = url.hostname;

        // Validate hostname contains only valid characters
        // Valid hostnames contain: letters, numbers, dots, hyphens
        // Invalid characters like !, #, etc. indicate a malformed domain
        const validHostnamePattern = /^[a-zA-Z0-9.-]+$/;
        if (!validHostnamePattern.test(hostname)) {
          nameFromDomain = null;
        } else if (!isIpAddress(hostname)) {
          // Check if it's an IP address - not meaningful for workspace names
          // Handle localhost as special case
          if (hostname === 'localhost') {
            nameFromDomain = 'Localhost';
          } else {
            // Split hostname by dots to get domain parts
            const parts = hostname.split('.');

            // Get the main domain name (second-to-last part before TLD)
            // For "api.example.com" → use "example"
            // For "example.com" → use "example"
            // For single part domains → use that part
            const domainName = parts.length >= 2 ? parts[parts.length - 2] : parts[0];

            if (domainName) {
              // Split by hyphens and capitalize each word
              nameFromDomain = domainName
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            }
          }
        }
      }
    } catch {
      // URL parsing failed - domain is invalid, will fall back to user name
      nameFromDomain = null;
    }
  }

  // If we got a meaningful domain name (not localhost), use it
  if (nameFromDomain && nameFromDomain !== 'Localhost') {
    return nameFromDomain;
  }

  // If we got "Localhost" but have a user name, prefer user name
  if (nameFromDomain === 'Localhost' && userName && userName.trim() !== '') {
    // Fall through to user name logic
  } else if (nameFromDomain === 'Localhost') {
    // No user name available, use Localhost
    return nameFromDomain;
  }

  // Derive from user name
  if (userName && userName.trim() !== '') {
    const firstName = userName.trim().split(/\s+/)[0];
    if (firstName) {
      return `${firstName}'s workspace`;
    }
  }

  // Final fallback
  return 'Userplane Workspace';
}

/**
 * Derive workspace URL from email address
 * Extracts domain from email and formats as https URL
 *
 * @param email - User email address
 * @returns URL string (e.g., "https://example.com")
 *
 * @example
 * deriveWorkspaceUrl("user@example.com") → "https://example.com"
 * deriveWorkspaceUrl("admin@subdomain.company.io") → "https://subdomain.company.io"
 */
export function deriveWorkspaceUrl(email: string): string {
  const domain = getEmailDomain(email);
  if (!domain || isDisposableEmail(email)) {
    return 'https://userplane.io';
  }
  return `https://${domain}`;
}
