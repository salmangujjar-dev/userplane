/**
 * Type utilities for the Userplane API client
 *
 * Re-exports useful types from oRPC and the contract package
 */

import type { JsonifiedClient } from '@orpc/openapi-client';
import type { ContractRouterClient } from '@orpc/contract';
import type { contract } from '@workspace/contract';
import type { ClientContext } from './index';

/**
 * The complete API client type
 */
export type UserplaneClient = JsonifiedClient<ContractRouterClient<typeof contract, ClientContext>>;

/**
 * Status API types
 */
export type StatusClient = UserplaneClient['status'];

/**
 * Account API types
 */
export type AccountClient = UserplaneClient['account'];

/**
 * Provisioner API types
 */
export type ProvisionerClient = UserplaneClient['provisioner'];

/**
 * Workspace API types
 */
export type WorkspaceClient = UserplaneClient['workspace'];

/**
 * Invite API types
 */
export type InviteClient = UserplaneClient['invite'];

/**
 * Domain API types
 */
export type DomainClient = UserplaneClient['domain'];

/**
 * Project API types
 */
export type ProjectClient = UserplaneClient['project'];

/**
 * Link API types
 */
export type LinkClient = UserplaneClient['link'];

/**
 * Recording API types
 */
export type RecordingClient = UserplaneClient['recording'];

/**
 * Session API types
 */
export type SessionClient = UserplaneClient['session'];

/**
 * Re-export contract types
 */
export type {
  Contract,
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
} from '@workspace/contract';
