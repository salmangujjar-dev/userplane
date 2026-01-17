/**
 * Link-related types
 */

import type { PaginationMeta } from './common';

/**
 * Link object
 */
export interface Link {
  linkId: string;
  linkURL: string;
  linkTitle: string | null;
  linkReusable: boolean;
  createdAt: string;
}

/**
 * Links list response
 */
export interface LinksData {
  links: Link[];
  pagination: PaginationMeta;
}
