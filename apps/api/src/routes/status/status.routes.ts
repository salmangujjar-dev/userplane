import { createRoute, z } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { jsonContent } from 'stoker/openapi/helpers';

const tags = ['Status'];

/**
 * Health data schema
 */
const HealthDataSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  version: z.string(),
});

/**
 * API info data schema
 */
const ApiInfoDataSchema = z.object({
  version: z.string(),
  name: z.string(),
  description: z.string(),
  endpoints: z.object({
    health: z.string(),
    api: z.string(),
  }),
});

/**
 * Standard API response wrapper for index endpoint
 */
const IndexResponseSchema = z.object({
  message: z.string(),
  data: ApiInfoDataSchema,
});

/**
 * Standard API response wrapper for health endpoint
 */
const HealthResponseSchema = z.object({
  message: z.string(),
  data: HealthDataSchema,
});

export const index = createRoute({
  path: '/',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(IndexResponseSchema, 'API index information'),
  },
});

export const health = createRoute({
  path: '/health',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(HealthResponseSchema, 'API health status'),
  },
});

export type IndexRoute = typeof index;
export type HealthRoute = typeof health;
