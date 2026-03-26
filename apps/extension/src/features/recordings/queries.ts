import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { RecordingItem, RecordingsListData, SortDirection } from '@userplane/contract';

import { apiClient } from '@/client';
import { DEFAULT_RECORDINGS_PER_PAGE } from '@/constants';
import { handleSafeResult } from '@/lib/errors';
import { useWorkspaceId } from '@/stores/workspace';

import { recordingKeys } from './query-keys';

export type Recording = RecordingItem;
export type RecordingsData = RecordingsListData;

export interface RecordingsFilters {
  createdBy?: string[];
  projectId?: string[];
  linkId?: string[];
  sortBy?: 'created_at' | 'recording_duration';
  sortDirection?: SortDirection;
}

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
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}

export function useInfiniteWorkspaceRecordings(options?: {
  perPage?: number;
  filters?: RecordingsFilters;
  enabled?: boolean;
}) {
  const workspaceId = useWorkspaceId();
  const { perPage = DEFAULT_RECORDINGS_PER_PAGE, filters = {}, enabled = true } = options || {};

  return useInfiniteQuery({
    queryKey: recordingKeys.infiniteList(workspaceId ?? '', {
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
    queryFn: async ({ pageParam }) => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }

      const [error, response] = await apiClient.recording.list({
        params: { workspaceId },
        query: {
          page: pageParam,
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
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.success) return undefined;
      return lastPage.data.pagination.hasMore ? lastPage.data.pagination.page + 1 : undefined;
    },
    enabled: enabled && !!workspaceId,
    staleTime: 2 * 60 * 1000,
    refetchOnMount: 'always',
    retry: 1,
  });
}
