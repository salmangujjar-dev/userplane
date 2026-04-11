import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/client';
import {
  handleSafeResult,
  handleUnknownError,
  type SafeResult,
  showApiErrorToast,
} from '@/lib/errors';
import { showUpdatedToast } from '@/lib/toasts';

import { mcpConnectionKeys } from './query-keys';

/**
 * Revoke an authorized MCP client connection by clientId.
 */
export function useRevokeMcpConnection() {
  const queryClient = useQueryClient();

  return useMutation<SafeResult<{ revoked: true }>, Error, string>({
    mutationFn: async (clientId) => {
      const [error, response] = await apiClient.mcpConnection.revoke({
        params: { clientId },
      });
      return handleSafeResult(error, (response?.data as { revoked: true }) ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        showApiErrorToast(result.error);
        return;
      }
      showUpdatedToast('MCP connection', 'Access has been revoked');
    },
    onError: (error) => {
      handleUnknownError(error, 'Failed to revoke MCP connection');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: mcpConnectionKeys.all });
    },
  });
}
