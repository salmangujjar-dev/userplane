import type { AppRouteHandler } from '../../lib/types';
import type * as routes from './status.routes';

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
