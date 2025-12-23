/**
 * Common API types
 * Reusable types for consistent API responses
 */

/**
 * Pagination metadata
 * Standard pagination information for paginated responses
 */
export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Helper to calculate pagination metadata
 */
export function createPaginationMeta(page: number, perPage: number, total: number): PaginationMeta {
  const totalPages = Math.ceil(total / perPage);
  return {
    page,
    perPage,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
}
