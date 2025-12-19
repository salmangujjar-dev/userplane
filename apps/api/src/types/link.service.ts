/**
 * Link service types
 * Input types for link service operations
 */

import type { Link } from '@workspace/db';
import type { DomainStatus } from '@workspace/contract';

/**
 * Link type inferred from database schema
 * Single source of truth: changes to DB schema automatically propagate here
 */
export type LinkType = Link['linkType'];

/**
 * Link provider type inferred from database schema
 * Single source of truth: changes to DB schema automatically propagate here
 */
export type LinkProviderType = NonNullable<Link['linkProviderType']>;

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
 * createdBy, domainId, and linkProviderType accept arrays to support filtering by multiple values
 */
export interface LinkFilters {
  createdBy?: string[];
  projectId?: string;
  domainId?: string[];
  linkProviderType?: LinkProviderType[];
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

/**
 * Link item in list response
 */
export interface LinkItem {
  linkId: string;
  linkTitle: string | null;
  linkType: LinkType;
  linkReusable: boolean;
  linkProviderType: LinkProviderType;
  linkProviderId: string | null;
  linkProviderReference: string | null;
  linkURL: string;
  createdAt: Date;
  project: {
    projectId: string;
    title: string | null;
  };
  creator: {
    workspaceMemberId: string;
    name: string;
  };
  domain: {
    domainId: string;
    url: string;
    status: DomainStatus;
  };
}
