import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/client';
import { handleSafeResult, handleUnknownError, showErrorToast } from '@/lib/errors';
import { buildLinkMeta } from '@/lib/link-meta';

import { workspaceKeys } from '../workspace/query-keys';
import { linkKeys } from './query-keys';

interface CreateLinkInput {
  domainId: string;
  projectId?: string;
  linkReference?: string;
  linkReusable: boolean;
}

export function useCreateLink(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLinkInput) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const meta = await buildLinkMeta();
      const [error, response] = await apiClient.link.create({
        params: { workspaceId },
        body: { ...data, meta },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: linkKeys.all });
    },
    onError: (error: unknown) => {
      console.error('Failed to create link', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.all });
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.resourceCounts(workspaceId ?? ''),
      });
    },
  });
}

interface UpdateLinkInput {
  linkId: string;
  title: string;
  reference: string;
  reusable: boolean;
}

export function useUpdateLink(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ linkId, title, reference, reusable }: UpdateLinkInput) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.link.update({
        params: { workspaceId, linkId },
        body: {
          linkTitle: title || null,
          linkProviderRef: reference || null,
          linkReusable: reusable,
        },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: linkKeys.all });
    },
    onError: (error: unknown) => {
      console.error('Failed to update link', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.all });
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.resourceCounts(workspaceId ?? ''),
      });
    },
  });
}

export function useDeleteLink(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (linkId: string) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.link.delete({
        params: { workspaceId, linkId },
      });
      return handleSafeResult(error, response?.data ? { deleted: true } : null);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: linkKeys.all });
    },
    onSuccess: (result) => {
      if (!result.success) {
        showErrorToast(result.error);
      }
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to delete link');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.all });
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.resourceCounts(workspaceId ?? ''),
      });
    },
  });
}
