import { linkRepository } from '@/share/repositories/links.repository';
import type { Link } from '@/share/models/link';

/**
 * Service layer for links
 * Contains business logic and orchestrates repository calls
 * Simple read-only service for redirecting short codes to target URLs
 */

export class LinkService {
  /**
   * Get target URL for a short code
   * Returns null if link not found, inactive, or expired
   */
  getTargetUrl(shortCode: string): string | null {
    const link = linkRepository.findByShortCode(shortCode);

    if (!link) {
      return null;
    }

    if (!linkRepository.isValidForRedirect(link)) {
      return null;
    }

    return link.targetUrl;
  }

  /**
   * Get link details by short code
   * For API responses (optional, mainly for debugging)
   */
  getLink(shortCode: string): Link | null {
    return linkRepository.findByShortCode(shortCode);
  }

  /**
   * Get all links
   * Useful for debugging or monitoring
   */
  getAllLinks(): Link[] {
    return linkRepository.findAll();
  }

  /**
   * Get count of active links
   */
  getActiveLinksCount(): number {
    return linkRepository.countActiveLinks();
  }
}

export const linkService = new LinkService();
