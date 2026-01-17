import { useQuery } from '@tanstack/react-query';
import { useWorkspaceId } from '@/stores/workspace';
import { apiClient } from '@/client';
import { handleSafeResult, type SafeResult } from '@/lib/errors';
import { DEFAULT_RECORDINGS_PER_PAGE } from '@/constants/pagination';

export interface RecordingCreator {
  workspaceMemberId: string;
  name: string;
}

export interface Recording {
  recordingId: string;
  recordingThumbnail: string | null;
  recordingDurationMs: number | null;
  createdAt: string | Date;
  creator: RecordingCreator;
}

export interface RecordingsFilters {
  createdBy?: string[];
  projectId?: string[];
  linkId?: string[];
  sortBy?: 'created_at' | 'recording_duration';
  sortDirection?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface RecordingsData {
  workspaceId: string;
  recordings: Recording[];
  pagination: PaginationMeta;
}

/**
 * Hook to fetch recordings for the current workspace
 * Supports pagination and filtering by creator, project, and link
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 *
 * @example
 * ```tsx
 * function RecordingsList() {
 *   const { data, isLoading } = useWorkspaceRecordings({
 *     page: 1,
 *     perPage: 16,
 *     filters: { createdBy: ['member-1'], projectId: ['project-1'] }
 *   });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (data && !data.success) {
 *     return <ErrorState error={data.error} />;
 *   }
 *
 *   return (
 *     <div>
 *       {data.data.recordings.map(recording => (
 *         <RecordingPreview key={recording.recordingId} {...recording} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
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
    queryKey: [
      'recordings',
      workspaceId,
      page,
      perPage,
      filters.createdBy,
      filters.projectId,
      filters.linkId,
      filters.sortBy,
      filters.sortDirection,
    ],
    queryFn: async (): Promise<SafeResult<RecordingsData>> => {
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
