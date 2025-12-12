/**
 * Recording service types
 * Input types for recording service operations
 */

/**
 * Sortable fields for recordings
 */
export type RecordingSortField = 'created_at' | 'recording_duration';

/**
 * Sorting options for recordings
 */
export interface RecordingSortOptions {
  field: RecordingSortField;
  direction: 'asc' | 'desc';
}

import type { RecordingStatusGroup } from '../schema/recording.schema';

/**
 * Filters for listing recordings
 * All filters are optional and applied at database level
 * Each filter accepts an array to support filtering by multiple values
 * statusGroup defaults to 'AVAILABLE' if not specified
 * Note: statusGroup is for internal use only and NOT exposed at API layer
 */
export interface RecordingFilters {
  createdBy?: string[];
  projectId?: string[];
  linkId?: string[];
  statusGroup?: RecordingStatusGroup; // Internal use only - not exposed at API
}

/**
 * Parameters for listing recordings with pagination
 */
export interface ListRecordingsParams {
  workspaceId: string;
  page: number;
  perPage: number;
  filters?: RecordingFilters;
  sort?: RecordingSortOptions;
}
