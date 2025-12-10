/**
 * Recording API response data types
 * Types for recording endpoint responses
 */

import type { PaginationMeta } from './common';

/**
 * Creator information for recording
 */
export interface RecordingCreator {
  id: string;
  name: string;
}

/**
 * Recording item in list response
 */
export interface RecordingItem {
  id: string;
  recordingThumbnail: string | null;
  recordingDuration: number | null;
  createdAt: Date;
  creator: RecordingCreator;
}

/**
 * Response data for listing recordings
 */
export interface RecordingsListData {
  workspaceId: string;
  recordings: RecordingItem[];
  pagination: PaginationMeta;
}
