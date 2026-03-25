import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/client';
import {
  handleSafeResult,
  handleUnknownError,
  type SafeResult,
  showErrorToast,
} from '@/lib/errors';

import { workspaceKeys } from '../workspace/query-keys';
import type { LinksData } from './queries';
import { linkKeys } from './query-keys';

interface CreateLinkInput {
  domainId: string;
  projectId?: string;
  linkReference?: string;
  linkReusable: boolean;
}

type LinksQueryData = SafeResult<LinksData>;
type QuerySnapshot<T> = [readonly unknown[], T | undefined][];

export function useCreateLink(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLinkInput) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.link.create({
        params: { workspaceId },
        body: data,
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: linkKeys.lists() });

      const previousQueries: QuerySnapshot<LinksQueryData> =
        queryClient.getQueriesData<LinksQueryData>({
          queryKey: linkKeys.lists(),
        });

      return { previousQueries };
    },
    onSuccess: (result, _variables, context) => {
      if (!result.success) {
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
        return;
      }
    },
    onError: (error: unknown, _variables, context) => {
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      console.error('Failed to create link', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
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
    onMutate: async ({ linkId, title, reusable }) => {
      await queryClient.cancelQueries({ queryKey: linkKeys.lists() });

      const previousQueries: QuerySnapshot<LinksQueryData> =
        queryClient.getQueriesData<LinksQueryData>({
          queryKey: linkKeys.lists(),
        });

      queryClient.setQueriesData<LinksQueryData>({ queryKey: linkKeys.lists() }, (old) => {
        if (!old?.success) return old;
        return {
          ...old,
          data: {
            ...old.data,
            links: old.data.links.map((link) =>
              link.linkId === linkId
                ? { ...link, linkTitle: title || null, linkReusable: reusable }
                : link
            ),
          },
        };
      });

      return { previousQueries };
    },
    onSuccess: (result, _variables, context) => {
      if (!result.success) {
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
        return;
      }
    },
    onError: (error: unknown, _variables, context) => {
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      console.error('Failed to update link', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
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
    onMutate: async (linkId) => {
      await queryClient.cancelQueries({ queryKey: linkKeys.lists() });

      const previousQueries: QuerySnapshot<LinksQueryData> =
        queryClient.getQueriesData<LinksQueryData>({
          queryKey: linkKeys.lists(),
        });

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
    onSuccess: (result, _variables, context) => {
      if (!result.success) {
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
        showErrorToast(result.error);
        return;
      }
    },
    onError: (error: unknown, _variables, context) => {
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      handleUnknownError(error, 'Failed to delete link');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.resourceCounts(workspaceId ?? ''),
      });
    },
  });
}
