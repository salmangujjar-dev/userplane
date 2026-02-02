/**
 * Status contract implementation using oRPC
 * Implements public status and health check endpoints
 */

import { implement } from '@orpc/server';
import { contract } from '@workspace/contract';
import { SITE_META } from '@workspace/shared/meta';

/**
 * Public base for status endpoints (no auth required)
 */
const base = implement(contract);

const API_VERSION = '1.0.0';

/**
 * GET / - API information
 * Public endpoint - no authentication required
 */
export const apiInfoImpl = () => {
  return base.status.apiInfo.handler(async () => {
    return {
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
  });
};

/**
 * GET /health - Health check
 * Public endpoint - no authentication required
 */
export const healthImpl = () => {
  return base.status.health.handler(async () => {
    return {
      message: 'Service is healthy',
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: API_VERSION,
      },
    };
  });
};

/**
 * Create the status procedures object
 */
export const createStatusProcedures = () => {
  return {
    apiInfo: apiInfoImpl(),
    health: healthImpl(),
  };
};
