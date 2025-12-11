/**
 * Common validation schemas
 * Shared schemas used across multiple domains
 */

import { z } from 'zod';

/**
 * Pagination query schema
 * Used for listing endpoints with pagination
 */
export const paginationQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
});

/**
 * Generic ID parameter schema
 * Used for route parameters that require an ID
 */
export const idParamSchema = z.object({
  id: z.string().min(1),
});

/**
 * Sort directions
 */
export const SORT_DIRECTIONS = ['asc', 'desc'] as const;

export const sortDirectionSchema = z.enum(SORT_DIRECTIONS);
