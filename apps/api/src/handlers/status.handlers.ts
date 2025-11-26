import type { AppRouteHandler } from '@/api/lib/types';
import type * as routes from '@/api/routes/status/status.routes';

/**
 * Handler layer for status endpoints
 * Focuses solely on HTTP concerns
 */

export const index: AppRouteHandler<routes.IndexRoute> = (c) => {
  return c.json(
    {
      message: 'Welcome to Hono API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        api: '/api/v1',
      },
    },
    200
  );
};

export const health: AppRouteHandler<routes.HealthRoute> = (c) => {
  return c.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
    200
  );
};
