import type { LinkProviderType, LinkType } from '@userplane/contract';

export const linkKeys = {
  all: ['links'] as const,

  lists: () => [...linkKeys.all, 'list'] as const,
  list: (
    workspaceId: string,
    options?: {
      page?: number;
      perPage?: number;
      filters?: {
        createdBy?: string[];
        projectId?: string[];
        domainId?: string[];
        linkProviderType?: LinkProviderType[];
        linkType?: LinkType;
      };
      sort?: {
        by?: 'created_at' | 'link_title';
        direction?: 'asc' | 'desc';
      };
    }
  ) => [...linkKeys.lists(), workspaceId, options] as const,

  infiniteLists: () => [...linkKeys.all, 'infinite-list'] as const,
  infiniteList: (
    workspaceId: string,
    options?: {
      perPage?: number;
      filters?: {
        createdBy?: string[];
        projectId?: string[];
        domainId?: string[];
        linkProviderType?: LinkProviderType[];
        linkType?: LinkType;
      };
      sort?: {
        by?: 'created_at' | 'link_title';
        direction?: 'asc' | 'desc';
      };
    }
  ) => [...linkKeys.infiniteLists(), workspaceId, options] as const,
} as const;

export type LinkKeys = typeof linkKeys;
