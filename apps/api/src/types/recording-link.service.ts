/**
 * Recording link service types
 * Input types for recording link service operations
 */

import type { RecordingLink } from '@workspace/db';

/**
 * Link provider type inferred from database schema
 * Single source of truth: changes to DB schema automatically propagate here
 */
export type LinkProviderType = RecordingLink['linkProviderType'];

/**
 * Sortable fields for recording links
 */
export type RecordingLinkSortField = 'created_at' | 'link_title';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sorting options for recording links
 */
export interface RecordingLinkSortOptions {
  field: RecordingLinkSortField;
  direction: SortDirection;
}

/**
 * Filters for listing recording links
 * All filters are optional and applied at database level
 */
export interface RecordingLinkFilters {
  createdBy?: string;
  projectId?: string;
  domainId?: string;
  linkProviderType?: LinkProviderType;
}

/**
 * Parameters for listing recording links with pagination
 */
export interface ListRecordingLinksParams {
  workspaceId: string;
  page: number;
  perPage: number;
  filters?: RecordingLinkFilters;
  sort?: RecordingLinkSortOptions;
}
