/**
 * Query key factory for recording-related queries
 *
 * Structure:
 * - all: Base key for all recording queries
 * - details(): All detail queries
 * - detail(workspaceId, recordingId): Specific recording metadata
 * - resources(): All resource queries (video, thumbnail, logs)
 * - video/thumbnail/consoleLog/networkLog: Specific resource types
 * - lists(): All list queries
 * - list(workspaceId, options): Specific list configuration with filters
 *
 * Why this structure:
 * - Separates recording metadata from resources (video, thumbnails, logs)
 * - Enables granular invalidation (e.g., just video, not metadata)
 * - Groups related resources under common 'resources' namespace
 */
export const recordingKeys = {
  all: ['recordings'] as const,

  details: () => [...recordingKeys.all, 'detail'] as const,
  detail: (workspaceId: string, recordingId: string) =>
    [...recordingKeys.details(), workspaceId, recordingId] as const,

  // Resources: presigned URLs for media files
  resources: (workspaceId: string, recordingId: string) =>
    [...recordingKeys.all, 'resources', workspaceId, recordingId] as const,
  video: (workspaceId: string, recordingId: string) =>
    [...recordingKeys.resources(workspaceId, recordingId), 'video'] as const,
  thumbnail: (workspaceId: string, recordingId: string) =>
    [...recordingKeys.resources(workspaceId, recordingId), 'thumbnail'] as const,
  consoleLog: (workspaceId: string, recordingId: string) =>
    [...recordingKeys.resources(workspaceId, recordingId), 'console-log'] as const,
  networkLog: (workspaceId: string, recordingId: string) =>
    [...recordingKeys.resources(workspaceId, recordingId), 'network-log'] as const,

  lists: () => [...recordingKeys.all, 'list'] as const,
  list: (
    workspaceId: string,
    options?: {
      page?: number;
      perPage?: number;
      filters?: {
        createdBy?: string[];
        projectId?: string[];
        linkId?: string[];
      };
      sort?: {
        by?: 'created_at' | 'recording_duration';
        direction?: 'asc' | 'desc';
      };
    }
  ) => [...recordingKeys.lists(), workspaceId, options] as const,
} as const;

// Type helpers for query key inference
export type RecordingKeys = typeof recordingKeys;
