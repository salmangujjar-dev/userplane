/**
 * Database-related types
 * Transaction types and re-exports of database types for convenient importing
 */

import type { DbClient, WorkspaceRole, Domain, Workspace } from '@workspace/db';

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
 * Re-export types from database schema
 * These types are inferred from the database schema to ensure consistency
 * Single source of truth: changes to DB schema automatically propagate here
 */
export type { WorkspaceRole };
export type WorkspacePlan = Workspace['workspacePlan'];
export type DomainStatus = Domain['domainStatus'];
