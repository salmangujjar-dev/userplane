import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { handleSafeResult } from '@/lib/errors';

export type WorkspaceInvitePolicy = 'private' | 'whitelisted' | 'protected';
export type JoinAction = 'join' | 'request';

export interface SuggestedWorkspace {
  workspaceId: string;
  workspaceName: string;
  workspaceInvitePolicy: WorkspaceInvitePolicy;
  action: JoinAction;
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface WorkspaceSuggestionsData {
  workspaces: SuggestedWorkspace[];
  pagination: PaginationMeta;
}

/**
 * Hook to fetch suggested workspaces based on user's email domain
 * Returns paginated workspaces that match the user's email domain
 * Used when user has no workspaces to show discoverable options
 *
 * Returns SafeResult - check result.success before using data
 */
export function useWorkspaceSuggestions(options?: {
  page?: number;
  perPage?: number;
  enabled?: boolean;
}) {
  const { page = 1, perPage = 5, enabled = true } = options || {};

  return useQuery({
    queryKey: ['workspace-suggestions', page, perPage],
    queryFn: async () => {
      const [error, response] = await apiClient.workspace.suggest({
        query: { page, per_page: perPage },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
