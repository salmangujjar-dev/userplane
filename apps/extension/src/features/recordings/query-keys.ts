export const recordingKeys = {
  all: ['recordings'] as const,

  lists: () => [...recordingKeys.all, 'list'] as const,
  list: (
    workspaceId: string,
    options?: {
      page?: number;
      perPage?: number;
      filters?: {
        createdBy?: string[];
        projectId?: string[];
        linkId?: string[];
      };
      sort?: {
        by?: 'created_at' | 'recording_duration';
        direction?: 'asc' | 'desc';
      };
    }
  ) => [...recordingKeys.lists(), workspaceId, options] as const,

  infiniteLists: () => [...recordingKeys.all, 'infinite-list'] as const,
  infiniteList: (
    workspaceId: string,
    options?: {
      perPage?: number;
      filters?: {
        createdBy?: string[];
        projectId?: string[];
        linkId?: string[];
      };
      sort?: {
        by?: 'created_at' | 'recording_duration';
        direction?: 'asc' | 'desc';
      };
    }
  ) => [...recordingKeys.infiniteLists(), workspaceId, options] as const,
} as const;
