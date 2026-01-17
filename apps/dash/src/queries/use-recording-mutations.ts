import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { toast } from '@workspace/ui/components/sonner';
import { handleApiError, handleSafeResult, type SafeResult } from '@/lib/errors';
import type { RecordingsData } from '@/hooks/use-workspace-recordings';

interface DeleteRecordingData {
  deleted: boolean;
}

type RecordingsQueryData = SafeResult<RecordingsData>;
type QuerySnapshot = [queryKey: readonly unknown[], data: RecordingsQueryData | undefined][];

export function useDeleteRecording(workspaceId: string | null, onDeleteSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<DeleteRecordingData>,
    Error,
    string,
    { previousQueries: QuerySnapshot }
  >({
    mutationFn: async (recordingId: string) => {
      if (!workspaceId || !recordingId) throw new Error('Missing workspace or recording ID');
      const [error, response] = await apiClient.recording.delete({
        params: { workspaceId, recordingId },
      });
      return handleSafeResult(error, response?.data ? { deleted: true } : null);
    },
    onMutate: async (recordingId: string) => {
      await queryClient.cancelQueries({ queryKey: ['recordings', workspaceId] });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot = queryClient.getQueriesData<RecordingsQueryData>({
        queryKey: ['recordings', workspaceId],
      });

      // Update ALL matching queries
      queryClient.setQueriesData<RecordingsQueryData>(
        { queryKey: ['recordings', workspaceId] },
        (old) => {
          if (!old?.success) return old;
          return {
            ...old,
            data: {
              ...old.data,
              recordings: old.data.recordings.filter((r) => r.recordingId !== recordingId),
              pagination: {
                ...old.data.pagination,
                total: Math.max(0, old.data.pagination.total - 1),
              },
            },
          };
        }
      );

      return { previousQueries };
    },
    onSuccess: (result, recordingId, context) => {
      if (!result.success) {
        // Rollback all queries
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
        handleApiError(result.error, 'Failed to delete recording');
        return;
      }
      toast.success('Recording deleted successfully');
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    },
    onError: (error: unknown, recordingId, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-resource-counts', workspaceId] });
    },
  });
}
