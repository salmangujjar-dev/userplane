'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/sonner';
import { apiClient } from '@/client';
import { useWorkspaceStore } from '@/stores/workspace';
import type { SafeResult } from '@/lib/errors';
import { handleSafeResult, handleApiError } from '@/lib/errors';

interface SendInstructionsData {
  sentCount: number;
}

interface SendDomainInstructionsParams {
  domainId: string;
  emails: string[];
}

export function useSendDomainInstructions() {
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);

  return useMutation<SafeResult<SendInstructionsData>, Error, SendDomainInstructionsParams>({
    mutationFn: async ({ domainId, emails }: SendDomainInstructionsParams) => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.workspace.domains.sendInstructions({
        params: { workspaceId, domainId },
        body: { emails },
      });
      return handleSafeResult(error, response?.data ? { sentCount: emails.length } : null);
    },
    onSuccess: (result, { emails }) => {
      if (!result.success) {
        handleApiError(result.error, 'Failed to send developer instructions');
        return;
      }
      toast.success(`Instructions sent to ${emails.length} email${emails.length > 1 ? 's' : ''}`);
    },
    onError: (error: unknown) => {
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}
