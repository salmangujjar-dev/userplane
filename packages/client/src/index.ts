/**
 * @workspace/client
 *
 * Type-safe client for the Userplane API
 * Provides full type safety based on oRPC contracts
 */

import type { JsonifiedClient } from '@orpc/openapi-client';
import type { ContractRouterClient } from '@orpc/contract';
import { createORPCClient, onError } from '@orpc/client';
import { OpenAPILink } from '@orpc/openapi-client/fetch';
import { contract } from '@workspace/contract';

/**
 * Client context for passing additional data to API calls
 */
export interface ClientContext {
  /**
   * Additional headers for this specific request
   */
  headers?: Record<string, string>;
}

/**
 * Configuration for creating the API client
 */
export interface ClientConfig {
  /**
   * Base URL of the API
   * @example 'http://localhost:3000/api/v2'
   * @example 'https://api.userplane.com/api/v2'
   */
  url: string | (() => string);

  /**
   * Default headers to include in all requests
   * Can be a static object or a function that returns headers dynamically
   */
  headers?:
    | Record<string, string>
    | ((params: {
        context?: ClientContext;
      }) => Record<string, string> | Promise<Record<string, string>>);

  /**
   * Custom fetch implementation
   * @default globalThis.fetch
   */
  fetch?: (request: Request | string, init?: RequestInit) => Promise<Response>;

  /**
   * Include credentials for cross-origin requests
   * @default 'include'
   */
  credentials?: RequestCredentials;

  /**
   * Custom error handler for all requests
   */
  onError?: (error: unknown) => void;
}

/**
 * Creates a type-safe API client
 *
 * The client provides full compile-time type safety based on the API contract.
 * All request and response types are validated at compile time.
 *
 * @example Basic usage
 * ```ts
 * const client = createClient({
 *   url: 'http://localhost:3000/api/v2',
 * });
 *
 * const session = await client.session.init({
 *   body: {
 *     linkId: 'link-123',
 *     metadata: {},
 *   },
 * });
 * ```
 *
 * @example With authentication
 * ```ts
 * const client = createClient({
 *   url: 'http://localhost:3000/api/v2',
 *   headers: {
 *     'Authorization': 'Bearer token',
 *   },
 * });
 * ```
 *
 * @example With dynamic headers
 * ```ts
 * const client = createClient({
 *   url: 'http://localhost:3000/api/v2',
 *   headers: ({ context }) => ({
 *     'Authorization': `Bearer ${context?.headers?.token}`,
 *   }),
 * });
 *
 * await client.session.init(
 *   { body: { linkId: 'link-123' } },
 *   { context: { headers: { token: 'my-token' } } }
 * );
 * ```
 */
export function createClient(
  config: ClientConfig
): JsonifiedClient<ContractRouterClient<typeof contract, ClientContext>> {
  const link = new OpenAPILink<ClientContext>(contract, {
    url: config.url,
    headers: config.headers,
    fetch: config.fetch
      ? (request, init) => {
          return config.fetch!(request, {
            ...init,
            credentials: config.credentials ?? 'include',
          });
        }
      : (request, init) => {
          return globalThis.fetch(request, {
            ...init,
            credentials: config.credentials ?? 'include',
          });
        },
    interceptors: config.onError ? [onError(config.onError)] : [],
  });

  return createORPCClient(link);
}

/**
 * Re-export contract for convenience
 */
export { contract } from '@workspace/contract';
export type { Contract } from '@workspace/contract';

/**
 * Re-export useful oRPC client type utilities
 */
export type {
  InferClientInputs,
  InferClientBodyInputs,
  InferClientOutputs,
  InferClientBodyOutputs,
  InferClientErrors,
  InferClientErrorUnion,
  InferClientContext,
} from '@orpc/client';

/**
 * Re-export domain-specific client types
 */
export type {
  UserplaneClient,
  StatusClient,
  AccountClient,
  ProvisionerClient,
  WorkspaceClient,
  InviteClient,
  DomainClient,
  ProjectClient,
  LinkClient,
  RecordingClient,
  SessionClient,
  StatusContract,
  AccountContract,
  ProvisionerContract,
  WorkspaceContract,
  InviteContract,
  DomainContract,
  ProjectContract,
  LinkContract,
  RecordingContract,
  SessionContract,
} from './types';
