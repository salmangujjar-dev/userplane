/**
 * Database-related types
 * Transaction types and database operation types
 */

import type { DbClient } from '@workspace/db';
import {
  workspacePlanEnum,
  workspaceRoleEnum,
  storeProviderEnum,
  domainStatusEnum,
} from '@workspace/db';

/**
 * Database transaction type
 * Used in repository operations that need to be part of a transaction
 */
export type Transaction = Parameters<Parameters<DbClient['transaction']>[0]>[0];

/**
 * Transaction options for repository methods
 */
export interface TransactionOptions {
  tx?: Transaction;
}

/**
 * Extract enum values from database schema
 * Provides TypeScript types derived directly from database enums
 */
export type WorkspacePlan = (typeof workspacePlanEnum.enumValues)[number];
export type WorkspaceRole = (typeof workspaceRoleEnum.enumValues)[number];
export type StoreProvider = (typeof storeProviderEnum.enumValues)[number];
export type DomainStatus = (typeof domainStatusEnum.enumValues)[number];
