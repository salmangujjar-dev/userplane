/**
 * HTTP client for Userplane API
 * Authenticated via apiToken from Zendesk app secure parameters
 */

import type {
  ZendeskCreateLinkBody,
  ZendeskCreateLinkResponse,
  ZendeskDomainsResponse,
  ZendeskProjectsResponse,
  ZendeskStatusResponse,
} from '@userplane/contract';

import { API_BASE_URL } from '@/lib/constants';

interface ApiClientOptions {
  apiToken: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private apiToken: string;
  private baseUrl: string;

  constructor(options: ApiClientOptions) {
    this.apiToken = options.apiToken;
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api/v1/zendesk${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new ApiError(
        body.error || `HTTP ${response.status}`,
        body.code || 'UNKNOWN_ERROR',
        response.status
      );
    }

    return response.json();
  }

  async getProjects(workspaceId: string) {
    return this.request<ZendeskProjectsResponse>(`/projects?workspaceId=${workspaceId}`);
  }

  async getDomains(workspaceId: string) {
    return this.request<ZendeskDomainsResponse>(`/domains?workspaceId=${workspaceId}`);
  }

  async createLink(params: ZendeskCreateLinkBody) {
    return this.request<ZendeskCreateLinkResponse>('/links', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getStatus(workspaceId: string) {
    return this.request<ZendeskStatusResponse>(`/status?workspaceId=${workspaceId}`);
  }
}

let clientInstance: ApiClient | null = null;

export function initApiClient(apiToken: string): ApiClient {
  clientInstance = new ApiClient({ apiToken });
  return clientInstance;
}

export function getApiClient(): ApiClient {
  if (!clientInstance) {
    throw new Error('API client not initialized. Call initApiClient first.');
  }
  return clientInstance;
}
