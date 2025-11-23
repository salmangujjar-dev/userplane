/**
 * @workspace/api-client
 *
 * Shared Hono RPC client for all frontend applications
 * Provides type-safe API communication with the backend
 */

import { hc } from 'hono/client';
import type { AppType } from '../../../apps/api/src/index.js';

/**
 * Configuration options for the API client
 */
export interface ApiClientConfig {
  /**
   * Base URL of the API server
   * @example 'http://localhost:3001'
   */
  baseUrl: string;

  /**
   * Whether to include credentials (cookies) in requests
   * @default true
   */
  credentials?: boolean;

  /**
   * Additional fetch options to apply to all requests
   */
  fetchOptions?: RequestInit;
}

/**
 * Pre-compiled client type for better IDE performance
 * This trick calculates the type at compile time instead of runtime
 */
export type ApiClient = ReturnType<typeof hc<AppType>>;

/**
 * Create a typed Hono RPC client
 *
 * @param config - Configuration options for the client
 * @returns Typed API client
 *
 * @example
 * ```typescript
 * import { createApiClient } from '@workspace/api-client';
 *
 * const client = createApiClient({
 *   baseUrl: 'http://localhost:3001',
 *   credentials: true,
 * });
 *
 * // Access API routes
 * const api = client['api']['v1'];
 * const res = await api.users.$get();
 * ```
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  const { baseUrl, credentials = true, fetchOptions = {} } = config;

  return hc<AppType>(baseUrl, {
    init: {
      credentials: credentials ? 'include' : 'same-origin',
      ...fetchOptions,
    },
  });
}

/**
 * Create a pre-configured API client
 *
 * @param config - Configuration options for the client
 * @returns API client with v1 routes exposed directly
 *
 * @example
 * ```typescript
 * import { createApi } from '@workspace/api-client';
 *
 * const api = createApi({
 *   baseUrl: 'http://localhost:3001',
 * });
 *
 * // Access API routes - routes are at the top level from AppType export
 * const res = await api.users.$get();
 * ```
 */
export function createApi(config: ApiClientConfig) {
  const client = createApiClient(config) as any;
  return client.api.v1;
}

/**
 * Re-export Hono client types for convenience
 */
export type { InferRequestType, InferResponseType } from 'hono/client';

/**
 * Re-export AppType for type references
 */
export type { AppType };
