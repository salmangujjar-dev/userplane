import { oc } from '@orpc/contract';
import { ApiInfoDataSchema, HealthDataSchema, ApiResponseSchema } from '../schemas';

/**
 * Status contract
 * Endpoints for API status and health checks
 */

/**
 * GET /
 * Get API information
 */
export const apiInfo = oc
  .route({
    method: 'GET',
    path: '/',
    summary: 'Get API info',
    description: 'Retrieve API version and endpoint information',
    tags: ['Status'],
  })
  .output(ApiResponseSchema(ApiInfoDataSchema));

/**
 * GET /health
 * Health check endpoint
 */
export const health = oc
  .route({
    method: 'GET',
    path: '/health',
    summary: 'Health check',
    description: 'Check API health status',
    tags: ['Status'],
  })
  .output(ApiResponseSchema(HealthDataSchema));
