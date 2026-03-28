import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/client';
import { handleSafeResult, handleUnknownError, showApiErrorToast } from '@/lib/errors';
import { showCreatedToast, showDeletedToast, showUpdatedToast } from '@/lib/toasts';
import type { QueryData, QuerySnapshot } from '@/types';

import { workspaceKeys } from '../workspace/query-keys';
import type { LinksData } from './queries';
import { linkKeys } from './query-keys';

interface CreateLinkInput {
  domainId: string;
  projectId?: string;
  linkReference?: string;
  linkReusable: boolean;
  meta?: Record<string, string>;
}

type LinksQueryData = QueryData<LinksData>;

type CreateLinkOptions = CreateLinkInput;

export function useCreateLink(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLinkOptions) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.link.create({
        params: { workspaceId },
        body: data,
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: linkKeys.lists() });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot<LinksQueryData> =
        queryClient.getQueriesData<LinksQueryData>({
          queryKey: linkKeys.lists(),
        });

      // Skip optimistic update - wait for server response instead
      // This avoids issues with incomplete data during optimistic rendering
      // The real link will be added via onSettled invalidation

      return { previousQueries };
    },
    onSuccess: (result, _variables, context) => {
      if (!result.success) {
        // Rollback all queries
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });

        // PLAN_LIMIT_EXCEEDED is handled by the caller via upsell sheet
        if (result.error.code !== 'PLAN_LIMIT_EXCEEDED') {
          showApiErrorToast(result.error);
        }
        return;
      }
      showCreatedToast('Link', 'Short link is ready to share');
    },
    onError: (error: unknown, _variables, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      handleUnknownError(error, 'Failed to create link');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.resourceCounts(workspaceId ?? '') });
    },
  });
}

interface UpdateLinkInput {
  linkId: string;
  title: string;
  reference: string;
  reusable: boolean;
  meta?: Record<string, string>;
}

export function useUpdateLink(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ linkId, title, reference, reusable, meta }: UpdateLinkInput) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.link.update({
        params: { workspaceId, linkId },
        body: {
          linkTitle: title || null,
          linkProviderRef: reference || null,
          linkReusable: reusable,
          meta,
        },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async ({ linkId, title, reusable, meta }) => {
      await queryClient.cancelQueries({ queryKey: linkKeys.lists() });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot<LinksQueryData> =
        queryClient.getQueriesData<LinksQueryData>({
          queryKey: linkKeys.lists(),
        });

      // Update ALL matching queries
      queryClient.setQueriesData<LinksQueryData>({ queryKey: linkKeys.lists() }, (old) => {
        if (!old?.success) return old;
        return {
          ...old,
          data: {
            ...old.data,
            links: old.data.links.map((link) =>
              link.linkId === linkId
                ? {
                    ...link,
                    linkTitle: title || null,
                    linkReusable: reusable,
                    meta: meta ?? link.meta,
                  }
                : link
            ),
          },
        };
      });

      return { previousQueries };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        // Rollback all queries
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
        showApiErrorToast(result.error);
        return;
      }
      showUpdatedToast('Link');
    },
    onError: (error: unknown, variables, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      handleUnknownError(error, 'Failed to update link');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.resourceCounts(workspaceId ?? '') });
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
    onMutate: async (linkId) => {
      await queryClient.cancelQueries({ queryKey: linkKeys.lists() });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot<LinksQueryData> =
        queryClient.getQueriesData<LinksQueryData>({
          queryKey: linkKeys.lists(),
        });

      // Update ALL matching queries
      queryClient.setQueriesData<LinksQueryData>({ queryKey: linkKeys.lists() }, (old) => {
        if (!old?.success) return old;
        return {
          ...old,
          data: {
            ...old.data,
            links: old.data.links.filter((link) => link.linkId !== linkId),
            pagination: {
              ...old.data.pagination,
              total: Math.max(0, old.data.pagination.total - 1),
            },
          },
        };
      });

      return { previousQueries };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        // Rollback all queries
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
        showApiErrorToast(result.error);
        return;
      }
      showDeletedToast('Link', 'Link has been permanently removed');
    },
    onError: (error: unknown, variables, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      handleUnknownError(error, 'Failed to delete link');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.resourceCounts(workspaceId ?? '') });
    },
  });
}
