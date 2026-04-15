import { getPreferenceValues } from '@raycast/api';

import { normalizeOrigin } from '../utils/normalize-url';
import type {
  DomainsListData,
  LinkCreateData,
  LinksListData,
  LinksQuery,
  MembersListData,
  ProjectsListData,
  RecordingsListData,
  RecordingsQuery,
  WorkspacesListData,
} from './types';

interface Preferences {
  apiKey: string;
  apiBaseUrl?: string;
  dashBaseUrl?: string;
}

const DEFAULT_API_HOST = 'api.userplane.io';

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  query?: object;
  body?: unknown;
}

function getApiConfig() {
  const { apiKey, apiBaseUrl } = getPreferenceValues<Preferences>();
  return {
    baseUrl: `${normalizeOrigin(apiBaseUrl, DEFAULT_API_HOST)}/api/v1`,
    apiKey: apiKey.trim(),
  };
}

function serializeQuery(query: object | undefined): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null) continue;
        params.append(key, String(item));
      }
    } else {
      params.append(key, String(value));
    }
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

async function callApi<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { baseUrl, apiKey } = getApiConfig();
  const url = `${baseUrl}${path}${serializeQuery(options.query)}`;

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'User-Agent': 'userplane-raycast/0.1.0',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let parsed: unknown = undefined;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      // non-JSON body
    }
  }

  if (!response.ok) {
    const errObj = (parsed ?? {}) as { error?: string; message?: string };
    const code = errObj.error;
    const message = errObj.message || `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message, code);
  }

  if (!parsed || typeof parsed !== 'object' || !('data' in parsed)) {
    throw new ApiError(response.status, 'Malformed API response');
  }
  return (parsed as { data: T }).data;
}

export interface ListWorkspacesQuery {
  per_page?: number;
  include_workspace_membership?: boolean;
}

export interface ListDomainsQuery {
  per_page?: number;
}

export interface ListProjectsQuery {
  per_page?: number;
}

export interface ListMembersQuery {
  per_page?: number;
}

export interface ListLinksRequestQuery extends LinksQuery {
  page?: number;
  per_page?: number;
}

export interface ListRecordingsRequestQuery extends RecordingsQuery {
  page?: number;
  per_page?: number;
}

export interface CreateLinkBody {
  projectId?: string;
  domainId: string;
  linkReference?: string;
  linkReusable?: boolean;
  linkMeta: Record<string, string> | null;
}

export const api = {
  workspaces: {
    list(query: ListWorkspacesQuery = {}) {
      return callApi<WorkspacesListData>('/public/workspaces', { query });
    },
  },
  domains: {
    list(workspaceId: string, query: ListDomainsQuery = {}) {
      return callApi<DomainsListData>(`/public/workspace/${workspaceId}/domains`, { query });
    },
  },
  projects: {
    list(workspaceId: string, query: ListProjectsQuery = {}) {
      return callApi<ProjectsListData>(`/public/workspace/${workspaceId}/projects`, { query });
    },
  },
  members: {
    list(workspaceId: string, query: ListMembersQuery = {}) {
      return callApi<MembersListData>(`/public/workspace/${workspaceId}/members`, { query });
    },
  },
  links: {
    list(workspaceId: string, query: ListLinksRequestQuery = {}) {
      return callApi<LinksListData>(`/public/workspace/${workspaceId}/links`, { query });
    },
    create(workspaceId: string, body: CreateLinkBody) {
      return callApi<LinkCreateData>(`/public/workspace/${workspaceId}/links`, {
        method: 'POST',
        body,
      });
    },
  },
  recordings: {
    list(workspaceId: string, query: ListRecordingsRequestQuery = {}) {
      return callApi<RecordingsListData>(`/public/workspace/${workspaceId}/recordings`, { query });
    },
  },
};
