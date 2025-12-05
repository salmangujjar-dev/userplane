/**
 * Common API types
 * Reusable types for consistent API responses
 */

/**
 * Generic API response structure
 * All API responses follow this structure for consistency
 *
 * Success: { message: string, data?: T }
 * Error: { message: string, error: string, details?: unknown }
 */
export interface ApiResponse<T = undefined> {
  message: string;
  data?: T;
  error?: string;
  details?: unknown;
}

/**
 * Success response type (data is required)
 */
export interface ApiSuccessResponse<T> {
  message: string;
  data: T;
}

/**
 * Error response type
 */
export interface ApiErrorResponse {
  message: string;
  error: string;
  details?: unknown;
}

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
 * Generic paginated response
 * Use this to wrap any paginated data with consistent metadata
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
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
