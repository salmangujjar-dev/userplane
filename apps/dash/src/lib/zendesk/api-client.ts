/**
 * HTTP client for Zendesk app API calls.
 * Uses direct fetch() with apiToken (Bearer auth).
 * Separate from the dashboard's main API client (which uses session cookies).
 */

import type {
  ZendeskCreateLinkBody,
  ZendeskCreateLinkResponse,
  ZendeskDomainsResponse,
  ZendeskProjectsResponse,
  ZendeskStatusResponse,
} from '@userplane/contract';

export class ZendeskApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
    this.name = 'ZendeskApiError';
  }
}

class ZendeskApiClient {
  private apiToken: string;
  private baseUrl: string;

  constructor(apiToken: string, baseUrl: string) {
    this.apiToken = apiToken;
    this.baseUrl = baseUrl;
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
      throw new ZendeskApiError(
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

let clientInstance: ZendeskApiClient | null = null;

export function initZendeskApiClient(apiToken: string, baseUrl: string): ZendeskApiClient {
  clientInstance = new ZendeskApiClient(apiToken, baseUrl);
  return clientInstance;
}

export function getZendeskApiClient(): ZendeskApiClient {
  if (!clientInstance) {
    throw new Error('Zendesk API client not initialized. Call initZendeskApiClient first.');
  }
  return clientInstance;
}
