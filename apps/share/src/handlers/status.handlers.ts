import type { AppRouteHandler } from '@/share/lib/types';
import type * as routes from '@/share/routes/status/status.routes';

/**
 * Handler layer for status endpoints
 */

export const health: AppRouteHandler<routes.HealthRoute> = (c) => {
  return c.json(
    {
      status: 'healthy',
      service: 'share',
      timestamp: new Date().toISOString(),
    },
    200
  );
};
