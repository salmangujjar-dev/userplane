import type { Link } from '@/share/models/link';

/**
 * In-memory JSON list storage for short links
 * Simple JSON array that can be easily replaced with a file or database
 */

export type { Link };

/**
 * Links stored as a simple JSON array
 * In production, this could be loaded from a file, API, or database
 */
const links: Link[] = [
  {
    shortCode: 'demo',
    targetUrl: 'https://github.com',
    isActive: true,
  },
  {
    shortCode: 'example',
    targetUrl: 'https://example.com',
    isActive: true,
  },
  {
    shortCode: 'docs',
    targetUrl: 'https://docs.userplane.io',
    isActive: true,
  },
  {
    shortCode: 'expired',
    targetUrl: 'https://expired.com',
    isActive: true,
    expiresAt: '2020-01-01T00:00:00.000Z',
  },
  {
    shortCode: 'inactive',
    targetUrl: 'https://inactive.com',
    isActive: false,
  },
];

/**
 * Get all links
 */
export function getAllLinks(): Link[] {
  return links;
}

/**
 * Find a link by short code
 */
export function findLinkByShortCode(shortCode: string): Link | undefined {
  return links.find((link) => link.shortCode === shortCode);
}
