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

/**
 * Filters for listing recordings
 * All filters are optional and applied at database level
 * Each filter accepts an array to support filtering by multiple values
 */
export interface RecordingFilters {
  createdBy?: string[];
  projectId?: string[];
  linkId?: string[];
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
