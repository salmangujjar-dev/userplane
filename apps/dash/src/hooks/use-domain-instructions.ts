'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/sonner';

import { apiClient } from '@/client';
import type { SafeResult } from '@/lib/errors';
import { handleSafeResult, handleUnknownError, showErrorToast } from '@/lib/errors';
import { useWorkspaceStore } from '@/stores/workspace';

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
        showErrorToast(result.error);
        return;
      }
      toast.success(`Instructions sent to ${emails.length} email${emails.length > 1 ? 's' : ''}`);
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to send developer instructions');
    },
  });
}
