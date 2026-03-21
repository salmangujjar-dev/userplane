/**
 * HTTP client for Userplane API
 * Uses Zendesk's secure proxy via client.request() with {{setting.access_token}}.
 * The actual token is injected server-side by Zendesk — never visible in the browser.
 */

import type {
  ZendeskCreateLinkBody,
  ZendeskCreateLinkResponse,
  ZendeskDomainsResponse,
  ZendeskProjectsResponse,
  ZendeskStatusResponse,
} from '@userplane/contract';

import { API_BASE_URL } from '@/lib/constants';

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

/** Response from GET /api/v1/zendesk/me */
export interface ZendeskMeResponse {
  success: boolean;
  data: {
    workspaceId: string;
    subdomain: string;
    status: 'connected';
  };
}

class ApiClient {
  private zafClient: ZAFClientInstance;
  private baseUrl: string;

  constructor(zafClient: ZAFClientInstance) {
    this.zafClient = zafClient;
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(
    path: string,
    options?: { method?: string; body?: unknown }
  ): Promise<T> {
    try {
      const result = await this.zafClient.request<T>({
        url: `${this.baseUrl}/api/v1/zendesk${path}`,
        type: options?.method ?? 'GET',
        contentType: 'application/json',
        headers: {
          Authorization: 'Bearer {{setting.access_token}}',
        },
        data: options?.body ? JSON.stringify(options.body) : undefined,
        secure: true,
      });
      return result;
    } catch (err: unknown) {
      // ZAF request errors include status and responseJSON
      const zafError = err as { status?: number; responseJSON?: { error?: string; code?: string } };
      if (zafError.status && zafError.responseJSON) {
        throw new ApiError(
          zafError.responseJSON.error ?? `HTTP ${zafError.status}`,
          zafError.responseJSON.code ?? 'UNKNOWN_ERROR',
          zafError.status
        );
      }
      throw err;
    }
  }

  /** Get workspace context from the authenticated token (no params needed) */
  async getMe() {
    return this.request<ZendeskMeResponse>('/me');
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
      body: params,
    });
  }

  async getStatus(workspaceId: string) {
    return this.request<ZendeskStatusResponse>(`/status?workspaceId=${workspaceId}`);
  }
}

let clientInstance: ApiClient | null = null;

export function initApiClient(zafClient: ZAFClientInstance): ApiClient {
  clientInstance = new ApiClient(zafClient);
  return clientInstance;
}

export function getApiClient(): ApiClient {
  if (!clientInstance) {
    throw new Error('API client not initialized. Call initApiClient first.');
  }
  return clientInstance;
}
