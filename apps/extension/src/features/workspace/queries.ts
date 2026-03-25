import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/client';
import { DEFAULT_WORKSPACES_PER_PAGE } from '@/constants';
import { handleSafeResult, type SafeResult } from '@/lib/errors';
import { useWorkspaceId } from '@/stores/workspace';

import { workspaceKeys } from './query-keys';

const DEFAULT_MEMBERS_PER_PAGE = 5;

type SearchType = 'members' | 'projects' | 'domains' | 'links';

export interface SearchMember {
  workspaceMemberId: string;
  role: string;
  userName: string;
  userEmail: string;
}

export interface SearchProject {
  projectId: string;
  projectTitle: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchLink {
  linkId: string;
  linkTitle: string | null;
}

type SearchResult = SearchMember | SearchProject | SearchLink;

export function useWorkspace() {
  const workspaceId = useWorkspaceId();

  return useQuery({
    queryKey: workspaceKeys.detail(workspaceId ?? ''),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.workspace.getById({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useWorkspaces(options?: {
  page?: number;
  perPage?: number;
  includeWorkspaceMembership?: boolean;
  enabled?: boolean;
}) {
  const {
    page = 1,
    perPage = DEFAULT_WORKSPACES_PER_PAGE,
    includeWorkspaceMembership = true,
    enabled = true,
  } = options || {};

  return useQuery({
    queryKey: workspaceKeys.list({ page, perPage, includeWorkspaceMembership }),
    queryFn: async () => {
      const [error, response] = await apiClient.workspace.list({
        query: {
          page,
          per_page: perPage,
          include_workspace_membership: includeWorkspaceMembership,
        },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useWorkspaceMembers(options?: {
  perPage?: number;
  page?: number;
  enabled?: boolean;
}) {
  const workspaceId = useWorkspaceId();
  const { perPage = DEFAULT_MEMBERS_PER_PAGE, page = 1, enabled = true } = options || {};

  return useQuery({
    queryKey: workspaceKeys.membersList(workspaceId ?? '', { page, perPage }),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }

      const [error, response] = await apiClient.workspace.members.list({
        params: { workspaceId },
        query: { page, per_page: perPage },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: enabled && !!workspaceId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useWorkspaceSearch(options: {
  query: string;
  type: SearchType;
  limit?: number;
  enabled?: boolean;
}) {
  const workspaceId = useWorkspaceId();
  const { query, type, limit = 5, enabled = true } = options;

  return useQuery({
    queryKey: workspaceKeys.search(workspaceId ?? '', { type, query, limit }),
    queryFn: async (): Promise<SafeResult<SearchResult[]>> => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }

      if (!query || query.trim().length === 0) {
        return { success: true, data: [] };
      }

      const [error, response] = await apiClient.workspace.search({
        params: { workspaceId },
        query: {
          q: query.trim(),
          type,
          limit,
        },
      });

      return handleSafeResult(error, (response?.data.results as SearchResult[]) ?? null);
    },
    enabled: enabled && !!workspaceId && !!query && query.trim().length > 0,
    staleTime: 30 * 1000,
    retry: 1,
  });
}
