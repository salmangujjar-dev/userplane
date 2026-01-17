import { z } from 'zod';

/**
 * URL utility functions
 * Single source of truth - no aliases, no bullshit
 */

/**
 * Zod schema for URL validation
 */
const URLSchema = z.string().refine(
  (value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  },
  { message: 'Invalid URL format' }
);

/**
 * Check if string is valid http/https URL
 */
export function isValidUrl(text: string): boolean {
  if (!text || text.trim() === '') return false;

  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extract hostname from URL
 * Returns lowercase hostname or null
 */
export function extractHostname(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Extract main domain from hostname
 * "app.github.com" → "github"
 * "github.com" → "github"
 */
export function extractMainDomain(hostname: string): string | null {
  if (!hostname) return null;

  const parts = hostname.split('.');

  if (parts.length >= 2) {
    const mainDomain = parts[parts.length - 2];
    return mainDomain ? mainDomain.toLowerCase() : null;
  }

  const firstPart = parts[0];
  return firstPart ? firstPart.toLowerCase() : null;
}

/**
 * Extract URL from text that may contain mixed content
 * Uses Zod validation
 */
export function extractUrlFromString(text: string): string | null {
  if (!text || typeof text !== 'string' || text.trim() === '') return null;

  // Improved regex pattern with more accurate TLD length and better domain matching
  const urlPattern =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,63}\b([-a-zA-Z0-9()'@:%_+.~#?!&//=]*)/gi;
  const bracketsRegexp = /[()]|\.$/g;

  const matches = text.match(urlPattern);

  if (matches && matches.length > 0) {
    // Clean and validate each match, return first valid URL
    for (const match of matches) {
      const cleanedUrl = match.replace(bracketsRegexp, '');
      const urlParse = URLSchema.safeParse(cleanedUrl);
      if (urlParse.success) {
        return cleanedUrl;
      }
    }
  }

  return null;
}

/**
 * Clean URL for storage
 * Removes query params, hash, trailing slashes
 */
export function cleanUrl(url: string): string {
  try {
    const parsed = new URL(url);
    let pathname = parsed.pathname;

    pathname = pathname.replace(/\/+/g, '/');
    pathname = pathname.replace(/\/+$/, '');

    return `${parsed.protocol}//${parsed.host}${pathname}`;
  } catch (error) {
    throw new Error(`Invalid URL format: ${url}`);
  }
}

/**
 * Get Google Favicon API URL
 */
export function getFaviconUrl(domain: string, size: number = 128): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}
