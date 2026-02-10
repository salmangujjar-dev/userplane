import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/sonner';

import { apiClient } from '@/client';
import {
  handleSafeResult,
  handleUnknownError,
  type SafeResult,
  showErrorToast,
} from '@/lib/errors';
import type { DeleteResponse, QueryData, QuerySnapshot } from '@/types';

import { workspaceKeys } from '../workspace/query-keys';
import type { RecordingsData } from './queries';
import { recordingKeys } from './query-keys';

type RecordingsQueryData = QueryData<RecordingsData>;

export function useDeleteRecording(workspaceId: string | null, onDeleteSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<DeleteResponse>,
    Error,
    string,
    { previousQueries: QuerySnapshot<RecordingsQueryData> }
  >({
    mutationFn: async (recordingId: string) => {
      if (!workspaceId || !recordingId) throw new Error('Missing workspace or recording ID');
      const [error, response] = await apiClient.recording.delete({
        params: { workspaceId, recordingId },
      });
      return handleSafeResult(error, response?.data ? { deleted: true } : null);
    },
    onMutate: async (recordingId: string) => {
      await queryClient.cancelQueries({ queryKey: recordingKeys.lists() });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot<RecordingsQueryData> =
        queryClient.getQueriesData<RecordingsQueryData>({
          queryKey: recordingKeys.lists(),
        });

      // Update ALL matching queries
      queryClient.setQueriesData<RecordingsQueryData>(
        { queryKey: recordingKeys.lists() },
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
        showErrorToast(result.error);
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
      handleUnknownError(error, 'Failed to delete recording');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: recordingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.resourceCounts(workspaceId ?? '') });
    },
  });
}

interface UpdateRecordingExpiryInput {
  recordingId: string;
  expiresAt: Date | null;
}

export function useUpdateRecordingExpiry(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recordingId, expiresAt }: UpdateRecordingExpiryInput) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.recording.update({
        params: { workspaceId, recordingId },
        body: { expiresAt },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        showErrorToast(result.error);
        return;
      }
      toast.success('Recording expiration updated');
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to update recording expiration');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: recordingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recordingKeys.all });
    },
  });
}
