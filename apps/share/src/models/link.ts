/**
 * Link domain model
 * Core entity representing a shortened URL
 * Read-only - links are managed by other services
 */
export interface Link {
  shortCode: string;
  targetUrl: string;
  isActive: boolean;
  expiresAt?: string;
}
