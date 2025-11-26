import { findLinkByShortCode, getAllLinks } from '@/share/lib/storage';
import type { Link } from '@/share/models/link';

/**
 * Repository layer for links
 * Handles data access and provides an abstraction over the storage layer
 * In production, this would query a database or external API
 */

export class LinkRepository {
  /**
   * Find a link by its short code
   */
  findByShortCode(shortCode: string): Link | null {
    const link = findLinkByShortCode(shortCode);
    return link || null;
  }

  /**
   * Get all links
   * Useful for debugging or admin interfaces
   */
  findAll(): Link[] {
    return getAllLinks();
  }

  /**
   * Check if a link is valid for redirection
   * A link is valid if it's active and not expired
   */
  isValidForRedirect(link: Link): boolean {
    if (!link.isActive) {
      return false;
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Get the count of active links
   */
  countActiveLinks(): number {
    return getAllLinks().filter((link) => link.isActive).length;
  }
}

export const linkRepository = new LinkRepository();
