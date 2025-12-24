import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { toast } from '@workspace/ui/components/sonner';

export function useDeleteRecording(workspaceId: string | null, onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recordingId: string) => {
      if (!workspaceId || !recordingId) throw new Error('Missing workspace or recording ID');
      const [error, response] = await apiClient.recording.delete({
        params: { workspaceId, recordingId },
      });
      if (error) {
        console.log('error: ', error);
        throw error;
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings', workspaceId] });
      toast.success('Recording deleted successfully');
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete recording: ${error.message}`);
    },
  });
}
