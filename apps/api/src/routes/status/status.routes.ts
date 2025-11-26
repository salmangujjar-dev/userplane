import { createRoute, z } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { jsonContent } from 'stoker/openapi/helpers';

const tags = ['Status'];

const StatusSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  version: z.string().optional(),
});

const IndexSchema = z.object({
  message: z.string(),
  version: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  endpoints: z.object({
    health: z.string(),
    api: z.string(),
  }),
});

export const index = createRoute({
  path: '/',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(IndexSchema, 'API index information'),
  },
});

export const health = createRoute({
  path: '/health',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(StatusSchema, 'API health status'),
  },
});

export type IndexRoute = typeof index;
export type HealthRoute = typeof health;
