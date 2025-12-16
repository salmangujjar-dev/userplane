import { z } from 'zod';

/**
 * Status schemas
 */

/**
 * API info response
 */
export const ApiInfoDataSchema = z.object({
  version: z.string(),
  name: z.string(),
  description: z.string(),
  endpoints: z.object({
    health: z.string(),
    api: z.string(),
  }),
});

/**
 * Health check response
 */
export const HealthDataSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  version: z.string(),
});
