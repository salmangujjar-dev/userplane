/**
 * Store service types
 * Types for storage provider management operations
 */

import type { StoreProvider } from './database';

/**
 * Parameters for getting managed store
 */
export interface GetManagedStoreParams {
  pathPrefix: string;
}

/**
 * Parameters for creating user-managed store (BYOS)
 */
export interface CreateUserManagedStoreParams {
  workspaceId: string;
  provider: StoreProvider;
  providerUrl: string;
  providerAccessId: string;
  providerAccessKey: string;
  providerMeta?: Record<string, unknown>;
}
