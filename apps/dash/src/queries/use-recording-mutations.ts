import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { toast } from '@workspace/ui/components/sonner';
import { handleApiError, handleSafeResult, type SafeResult } from '@/lib/errors';

interface DeleteRecordingData {
  deleted: boolean;
}

export function useDeleteRecording(workspaceId: string | null, onDeleteSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation<SafeResult<DeleteRecordingData>, Error, string>({
    mutationFn: async (recordingId: string) => {
      if (!workspaceId || !recordingId) throw new Error('Missing workspace or recording ID');
      const [error, response] = await apiClient.recording.delete({
        params: { workspaceId, recordingId },
      });
      return handleSafeResult(error, response?.data ? { deleted: true } : null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        handleApiError(result.error, 'Failed to delete recording');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['recordings', workspaceId] });
      toast.success('Recording deleted successfully');
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    },
    onError: (error: unknown) => {
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}
