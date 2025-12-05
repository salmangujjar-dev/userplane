import type { AppRouteHandler } from '@/api/lib/types';
import type * as routes from '@/api/routes/status/status.routes';
import type { ApiSuccessResponse, ApiInfoData, HealthData } from '@/api/types';
import { SITE_META } from '@workspace/meta';

/**
 * Handler layer for status endpoints
 * Focuses solely on HTTP concerns
 * Uses metadata from @workspace/meta for consistent branding
 */

const API_VERSION = '1.0.0';

export const index: AppRouteHandler<routes.IndexRoute> = (c) => {
  const response: ApiSuccessResponse<ApiInfoData> = {
    message: 'Userplane Management API',
    data: {
      version: API_VERSION,
      name: SITE_META.title,
      description: SITE_META.description,
      endpoints: {
        health: '/health',
        api: '/api/v1',
      },
    },
  };
  return c.json(response, 200);
};

export const health: AppRouteHandler<routes.HealthRoute> = (c) => {
  const response: ApiSuccessResponse<HealthData> = {
    message: 'Service is healthy',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: API_VERSION,
    },
  };
  return c.json(response, 200);
};
