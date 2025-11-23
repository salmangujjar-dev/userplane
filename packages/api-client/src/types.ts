/**
 * Type definitions and helpers for the API client
 */

import type { InferRequestType, InferResponseType } from 'hono/client';
import type { createApi } from './index';

/**
 * Infer the type of the API object
 */
export type Api = ReturnType<typeof createApi>;

/**
 * Helper to extract awaited return type
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * Helper to extract JSON response type from a route
 */
export type JsonResponse<T> = T extends (...args: any[]) => Promise<Response>
  ? Awaited<ReturnType<Awaited<ReturnType<T>>['json']>>
  : never;

/**
 * Common API error structure
 */
export interface ApiError {
  error: string;
  message?: string;
}

/**
 * Common API success response
 */
export interface ApiSuccess<T = unknown> {
  data?: T;
  message?: string;
}

/**
 * Re-export Hono types
 */
export type { InferRequestType, InferResponseType };
