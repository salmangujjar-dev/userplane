/**
 * Common shared types used across the application
 */

import type { z } from 'zod';

import type { SafeResult } from '@/lib/errors';
import { PaginationMetaSchema } from '@/schemas';

/**
 * Re-export PaginationMeta from contract for convenience
 */
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

/**
 * Query snapshot type for optimistic updates rollback
 */
export type QuerySnapshot<T> = [queryKey: readonly unknown[], data: T | undefined][];

/**
 * Standard response wrapper with data and pagination
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Simple success response
 */
export interface SuccessResponse {
  success: boolean;
}

/**
 * Deletion response
 */
export interface DeleteResponse {
  deleted: boolean;
}

/**
 * Update response
 */
export interface UpdateResponse {
  updated: boolean;
}

/**
 * Generic query data wrapper for SafeResult
 */
export type QueryData<T> = SafeResult<T>;
