/**
 * Recording API response data types
 * Types for recording endpoint responses
 */

import type { PaginationMeta } from './common';
import type { RecordingMeta } from '@/api/repositories/recordings.repository';

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

/**
 * Recording link reference in recording detail
 */
export interface RecordingLinkRef {
  id: string;
  guid: string;
  title: string | null;
  providerType: string | null;
  providerId: string | null;
  providerRef: string | null;
  providerData: unknown;
  createdAt: Date;
}

/**
 * Project reference in recording detail
 */
export interface RecordingProjectRef {
  id: string;
  title: string | null;
  path: string;
}

/**
 * Domain reference in recording detail
 */
export interface RecordingDomainRef {
  id: string;
  url: string;
}

/**
 * Recording meta information
 * Combines recording link info, creator, project, domain, and recording metadata
 */
export interface RecordingDetailMeta {
  recordingLink: RecordingLinkRef;
  creator: RecordingCreator;
  project: RecordingProjectRef;
  domain: RecordingDomainRef;
  workspaceId: string;
  status: 'pending' | 'failed' | 'expired' | 'completed';
  recordingMeta: RecordingMeta | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Resource response with URL, message, and optional metrics
 */
export interface ResourceResponse {
  url: string | null;
  message: string;
  size?: number | null;
  duration?: number | null;
}

/**
 * Full recording detail response
 */
export interface RecordingDetail {
  id: string;
  meta: RecordingDetailMeta;
}

/**
 * Response data for getting a single recording
 */
export interface RecordingDetailData {
  workspaceId: string;
  recording: RecordingDetail;
}

/**
 * Response data for individual resource endpoints
 */
export interface RecordingResourceData {
  recordingId: string;
  resource: ResourceResponse;
}
