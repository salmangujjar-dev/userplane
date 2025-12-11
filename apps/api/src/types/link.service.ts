/**
 * Link service types
 * Input types for link service operations
 */

import type { Link } from '@workspace/db';

/**
 * Link type inferred from database schema
 * Single source of truth: changes to DB schema automatically propagate here
 */
export type LinkType = Link['linkType'];

/**
 * Link provider type inferred from database schema
 * Single source of truth: changes to DB schema automatically propagate here
 */
export type LinkProviderType = Link['linkProviderType'];

/**
 * Sortable fields for links
 */
export type LinkSortField = 'created_at' | 'link_title';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sorting options for links
 */
export interface LinkSortOptions {
  field: LinkSortField;
  direction: SortDirection;
}

/**
 * Filters for listing links
 * All filters are optional and applied at database level
 */
export interface LinkFilters {
  createdBy?: string;
  projectId?: string;
  domainId?: string;
  linkProviderType?: LinkProviderType;
  linkType?: LinkType;
}

/**
 * Parameters for listing links with pagination
 */
export interface ListLinksParams {
  workspaceId: string;
  page: number;
  perPage: number;
  filters?: LinkFilters;
  sort?: LinkSortOptions;
}
