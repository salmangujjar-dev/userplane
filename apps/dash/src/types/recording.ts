/**
 * Recording-related types
 */

import type { PaginationMeta } from './common';

/**
 * Recording object
 */
export interface Recording {
  recordingId: string;
  recordingTitle: string | null;
  recordingUrl: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Recordings list response
 */
export interface RecordingsData {
  recordings: Recording[];
  pagination: PaginationMeta;
}
