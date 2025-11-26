import { createRoute, z } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { jsonContent } from 'stoker/openapi/helpers';

const tags = ['Status'];

export const health = createRoute({
  path: '/health',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        status: z.string(),
        service: z.string(),
        timestamp: z.string(),
      }),
      'Service health status'
    ),
  },
});

export type HealthRoute = typeof health;
