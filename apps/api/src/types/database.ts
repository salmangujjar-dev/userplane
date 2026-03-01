/**
 * Database-related types
 * Transaction types for database operations
 */

import type { DbClient } from '@userplane/db';

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
