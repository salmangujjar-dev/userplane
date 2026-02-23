import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/client';
import {
  handleSafeResult,
  handleUnknownError,
  type SafeResult,
  showErrorToastToast,
} from '@/lib/errors';
import { showDeletedToast, showShareRecordingToast, showUpdatedToast } from '@/lib/toasts';
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
        showErrorToastToast(result.error);
        return;
      }
      showDeletedToast('Recording', 'Recording has been permanently removed');
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
        showErrorToastToast(result.error);
        return;
      }
      showUpdatedToast('Recording expiration', 'New expiration has been set');
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to update recording expiration');
    },
    onSettled: (_, __, { recordingId }) => {
      queryClient.invalidateQueries({ queryKey: recordingKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: recordingKeys.detail(workspaceId ?? '', recordingId),
      });
    },
  });
}

interface ShareRecordingInput {
  recordingId: string;
  emails: string[];
}

export function useShareRecording(workspaceId: string | null) {
  return useMutation({
    mutationFn: async ({ recordingId, emails }: ShareRecordingInput) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.recording.share({
        params: { workspaceId, recordingId },
        body: { emails },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        showErrorToastToast(result.error);
        return;
      }
      showShareRecordingToast(result.data.sent.length);
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to share recording');
    },
  });
}
