import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/client';
import {
  handleSafeResult,
  handleUnknownError,
  type SafeResult,
  showApiErrorToast,
} from '@/lib/errors';
import { showUpdatedToast } from '@/lib/toasts';
import type { ApiKeyCreateData } from '@/types';

import { apiKeyKeys } from './query-keys';

/**
 * Create a personal API key.
 * Returns the full key (shown once) on success.
 */
export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation<SafeResult<ApiKeyCreateData>, Error, { name?: string; expiresIn?: number }>({
    mutationFn: async (input) => {
      const [error, response] = await apiClient.apiKey.create({
        body: {
          name: input.name,
          expiresIn: input.expiresIn || undefined,
        },
      });
      return handleSafeResult(error, (response?.data as ApiKeyCreateData) ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        showApiErrorToast(result.error);
        return;
      }
    },
    onError: (error) => {
      handleUnknownError(error, 'Failed to create API key');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.all });
    },
  });
}

/**
 * Revoke a specific API key by keyId.
 */
export function useRevokeApiKey() {
  const queryClient = useQueryClient();

  return useMutation<SafeResult<{ revoked: true }>, Error, string>({
    mutationFn: async (keyId) => {
      const [error, response] = await apiClient.apiKey.delete({
        params: { keyId },
      });
      return handleSafeResult(error, (response?.data as { revoked: true }) ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        showApiErrorToast(result.error);
        return;
      }
      showUpdatedToast('API key', 'Your API key has been revoked');
    },
    onError: (error) => {
      handleUnknownError(error, 'Failed to revoke API key');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.all });
    },
  });
}

/**
 * Rotate a specific API key (revoke + create new).
 * Returns the new full key (shown once) on success.
 */
export function useRotateApiKey() {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<ApiKeyCreateData>,
    Error,
    { keyId: string; name?: string; expiresIn?: number }
  >({
    mutationFn: async (input) => {
      const [error, response] = await apiClient.apiKey.rotate({
        params: { keyId: input.keyId },
        body: {
          name: input.name,
          expiresIn: input.expiresIn || undefined,
        },
      });
      return handleSafeResult(error, (response?.data as ApiKeyCreateData) ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        showApiErrorToast(result.error);
        return;
      }
    },
    onError: (error) => {
      handleUnknownError(error, 'Failed to rotate API key');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.all });
    },
  });
}
