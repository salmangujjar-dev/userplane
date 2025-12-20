import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/sonner';
import { apiClient } from '@/client';
import type { Link } from '@/hooks/use-workspace-links';
import type { WorkspaceDomain } from '@/hooks/use-workspace-domains';

export function useCreateLink(workspaceId: string | null, domains?: WorkspaceDomain[]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      domainId: string;
      projectId?: string;
      linkReference?: string;
      linkReusable: boolean;
    }) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.link.create({
        params: { workspaceId },
        body: data,
      });
      if (error) throw error;
      return response;
    },
    onMutate: async (data: {
      domainId: string;
      projectId?: string;
      linkReference?: string;
      linkReusable: boolean;
    }) => {
      await queryClient.cancelQueries({ queryKey: ['links', workspaceId] });

      const previousLinks = queryClient.getQueryData(['links', workspaceId]);

      // Find domain for optimistic data
      const domain = domains?.find((d) => d.domainId === data.domainId);

      // Optimistically add new link
      const optimisticLink: Partial<Link> = {
        linkId: `temp-${Date.now()}`,
        linkURL: `${domain?.domainUrl || ''}/temp-link`,
        linkTitle: data.linkReference || null,
        linkReusable: data.linkReusable,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(['links', workspaceId], (old: { links: Link[] } | undefined) => {
        if (!old) return { links: [optimisticLink as Link] };
        return {
          ...old,
          links: [optimisticLink as Link, ...old.links],
        };
      });

      return { previousLinks };
    },
    onError: (
      error: Error,
      data: {
        domainId: string;
        projectId?: string;
        linkReference?: string;
        linkReusable: boolean;
      },
      context: { previousLinks: unknown } | undefined
    ) => {
      if (context?.previousLinks) {
        queryClient.setQueryData(['links', workspaceId], context.previousLinks);
      }
      toast.error(`Failed to create link: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Link created successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['links', workspaceId] });
    },
  });
}

export function useUpdateLink(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation<
    unknown,
    Error,
    { linkId: string; title: string; reference: string; reusable: boolean },
    { previousLinks: unknown }
  >({
    mutationFn: async ({ linkId, title, reference, reusable }) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.link.update({
        params: { workspaceId, linkId },
        body: {
          linkTitle: title || null,
          linkProviderRef: reference || null,
          linkReusable: reusable,
        },
      });
      if (error) throw error;
      return response.data;
    },
    onMutate: async ({ linkId, title, reusable }) => {
      await queryClient.cancelQueries({ queryKey: ['links', workspaceId] });

      const previousLinks = queryClient.getQueryData(['links', workspaceId]);

      queryClient.setQueryData(['links', workspaceId], (old: { links: Link[] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          links: old.links.map((link) =>
            link.linkId === linkId
              ? {
                  ...link,
                  linkTitle: title || null,
                  linkReusable: reusable,
                }
              : link
          ),
        };
      });

      return { previousLinks };
    },
    onError: (error, variables, context) => {
      if (context?.previousLinks) {
        queryClient.setQueryData(['links', workspaceId], context.previousLinks);
      }
      toast.error(`Failed to update link: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Link updated successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['links', workspaceId] });
    },
  });
}

export function useDeleteLink(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, string, { previousLinks: unknown }>({
    mutationFn: async (linkId) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.link.delete({
        params: { workspaceId, linkId },
      });
      if (error) throw error;
      return response.data;
    },
    onMutate: async (linkId) => {
      await queryClient.cancelQueries({ queryKey: ['links', workspaceId] });

      const previousLinks = queryClient.getQueryData(['links', workspaceId]);

      queryClient.setQueryData(['links', workspaceId], (old: { links: Link[] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          links: old.links.filter((link) => link.linkId !== linkId),
        };
      });

      return { previousLinks };
    },
    onError: (error, variables, context) => {
      if (context?.previousLinks) {
        queryClient.setQueryData(['links', workspaceId], context.previousLinks);
      }
      toast.error(`Failed to delete link: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Link deleted successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['links', workspaceId] });
    },
  });
}
