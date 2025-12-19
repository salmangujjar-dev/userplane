/**
 * Recording service types
 * Input types for recording service operations
 */

import type { RecordingStatusGroup } from '../schema/recording.schema';
import type { RecordingMeta } from '../schema/recording-meta.schema';
import type { LinkProviderType } from './link.service';
import type { Recording } from '@workspace/db';

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

/**
 * Recording item in list response
 */
export interface RecordingItem {
  recordingId: string;
  recordingThumbnail: string | null;
  recordingDurationMs: number | null;
  createdAt: Date;
  creator: {
    workspaceMemberId: string;
    name: string;
  };
}

/**
 * Detailed recording response
 */
export interface RecordingDetail {
  recordingId: string;
  meta: {
    link: {
      linkId: string;
      title: string | null;
      providerType: LinkProviderType;
      providerId: string | null;
      providerRef: string | null;
      providerData: unknown;
      createdAt: Date;
    };
    creator: {
      workspaceMemberId: string;
      name: string;
    };
    project: {
      projectId: string;
      title: string | null;
    };
    domain: {
      domainId: string;
      url: string;
    };
    workspaceId: string;
    status: Recording['uploadStatus'];
    recordingMeta: RecordingMeta | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Resource URL response
 */
export interface ResourceResponse {
  url: string | null;
  message: string;
  durationMs?: number | null;
}
