import { z } from 'zod';

/**
 * Diagnostics schemas
 * Type definitions and validation schemas for diagnostic operations
 */

/**
 * Diagnostic action types
 */
export const DiagnosticActionSchema = z.enum(['clear-cache']);
export type DiagnosticAction = z.infer<typeof DiagnosticActionSchema>;

/**
 * Cache types that can be cleared
 */
export const CacheTypeSchema = z.enum(['billing', 'subscription', 'entitlement', 'link']);
export type CacheType = z.infer<typeof CacheTypeSchema>;

/**
 * Clear cache action payload
 */
export const ClearCachePayloadSchema = z.object({
  types: z.array(CacheTypeSchema).min(1, 'At least one cache type must be selected'),
});
export type ClearCachePayload = z.infer<typeof ClearCachePayloadSchema>;

/**
 * Clear cache response data
 */
export const ClearCacheDataSchema = z.object({
  success: z.boolean(),
  types: z.array(CacheTypeSchema),
  message: z.string(),
  clearedKeys: z.array(z.string()).optional(),
});
export type ClearCacheData = z.infer<typeof ClearCacheDataSchema>;

/**
 * Diagnostics response data
 * When more actions are added, this can become a discriminated union
 */
export const DiagnosticsDataSchema = ClearCacheDataSchema;
export type DiagnosticsData = z.infer<typeof DiagnosticsDataSchema>;
