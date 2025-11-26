import type { AppRouteHandler } from '@/api/lib/types';
import type * as routes from '@/api/routes/status/status.routes';
import { SITE_META } from '@workspace/meta';

/**
 * Handler layer for status endpoints
 * Focuses solely on HTTP concerns
 * Uses metadata from @workspace/meta for consistent branding
 */

const API_VERSION = '1.0.0';

export const index: AppRouteHandler<routes.IndexRoute> = (c) => {
  return c.json(
    {
      message: 'Welcome to Hono API',
      version: API_VERSION,
      name: SITE_META.title,
      description: SITE_META.description,
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
      version: API_VERSION,
    },
    200
  );
};
