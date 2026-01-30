import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/client';
import { DEFAULT_RECORDINGS_PER_PAGE } from '@/constants/pagination';
import { handleSafeResult } from '@/lib/errors';
import { useWorkspaceId } from '@/stores/workspace';
import type { Recording, RecordingCreator, RecordingsData, SortDirection } from '@/types';

import { recordingKeys } from './query-keys';

// Re-export types for consumers
export type { Recording, RecordingCreator, RecordingsData };

export interface RecordingsFilters {
  createdBy?: string[];
  projectId?: string[];
  linkId?: string[];
  sortBy?: 'created_at' | 'recording_duration';
  sortDirection?: SortDirection;
}

/**
 * Hook to fetch recordings for the current workspace
 * Supports pagination and filtering by creator, project, and link
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useWorkspaceRecordings(options?: {
  page?: number;
  perPage?: number;
  filters?: RecordingsFilters;
  enabled?: boolean;
}) {
  const workspaceId = useWorkspaceId();
  const {
    page = 1,
    perPage = DEFAULT_RECORDINGS_PER_PAGE,
    filters = {},
    enabled = true,
  } = options || {};

  return useQuery({
    queryKey: recordingKeys.list(workspaceId ?? '', {
      page,
      perPage,
      filters: {
        createdBy: filters.createdBy,
        projectId: filters.projectId,
        linkId: filters.linkId,
      },
      sort: {
        by: filters.sortBy,
        direction: filters.sortDirection,
      },
    }),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }

      const [error, response] = await apiClient.recording.list({
        params: { workspaceId },
        query: {
          page,
          per_page: perPage,
          created_by: filters.createdBy,
          project_id: filters.projectId,
          link_id: filters.linkId,
          sort_by: filters.sortBy,
          sort_direction: filters.sortDirection,
        },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: enabled && !!workspaceId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch recording details by ID
 * Returns recording metadata and basic information
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useRecording(workspaceId: string | null, recordingId: string) {
  return useQuery({
    queryKey: recordingKeys.detail(workspaceId ?? '', recordingId),
    queryFn: async () => {
      if (!workspaceId || !recordingId) {
        throw new Error('Missing workspace or recording ID');
      }

      const [error, response] = await apiClient.recording.getById({
        params: { workspaceId, recordingId },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId && !!recordingId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch recording video resource
 * Returns presigned URL for video playback
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useRecordingVideo(workspaceId: string | null, recordingId: string) {
  return useQuery({
    queryKey: recordingKeys.video(workspaceId ?? '', recordingId),
    queryFn: async () => {
      if (!workspaceId || !recordingId) {
        throw new Error('Missing workspace or recording ID');
      }

      const [error, response] = await apiClient.recording.resources.video({
        params: { workspaceId, recordingId },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId && !!recordingId,
    staleTime: 50 * 60 * 1000, // 50 minutes (presigned URLs typically last 1 hour)
    retry: 2,
  });
}

/**
 * Hook to fetch recording thumbnail resource
 * Returns presigned URL for thumbnail image
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useRecordingThumbnail(workspaceId: string | null, recordingId: string) {
  return useQuery({
    queryKey: recordingKeys.thumbnail(workspaceId ?? '', recordingId),
    queryFn: async () => {
      if (!workspaceId || !recordingId) {
        throw new Error('Missing workspace or recording ID');
      }

      const [error, response] = await apiClient.recording.resources.thumbnail({
        params: { workspaceId, recordingId },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId && !!recordingId,
    staleTime: 50 * 60 * 1000, // 50 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch recording console log resource
 * Returns presigned URL for console log file
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useRecordingConsoleLog(workspaceId: string | null, recordingId: string) {
  return useQuery({
    queryKey: recordingKeys.consoleLog(workspaceId ?? '', recordingId),
    queryFn: async () => {
      if (!workspaceId || !recordingId) {
        throw new Error('Missing workspace or recording ID');
      }

      const [error, response] = await apiClient.recording.resources.consoleLog({
        params: { workspaceId, recordingId },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId && !!recordingId,
    staleTime: 50 * 60 * 1000, // 50 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch recording network log resource
 * Returns presigned URL for network log file
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useRecordingNetworkLog(workspaceId: string | null, recordingId: string) {
  return useQuery({
    queryKey: recordingKeys.networkLog(workspaceId ?? '', recordingId),
    queryFn: async () => {
      if (!workspaceId || !recordingId) {
        throw new Error('Missing workspace or recording ID');
      }

      const [error, response] = await apiClient.recording.resources.networkLog({
        params: { workspaceId, recordingId },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId && !!recordingId,
    staleTime: 50 * 60 * 1000, // 50 minutes
    retry: 2,
  });
}
