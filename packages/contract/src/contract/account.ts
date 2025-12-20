import { oc } from '@orpc/contract';
import {
  AccountDataSchema,
  UpdateAccountSchema,
  AccountUpdateDataSchema,
  ApiResponseSchema,
} from '../schemas';

/**
 * Account contract
 * Endpoints for user account operations
 */

/**
 * GET /account
 * Get current user's account information
 */
export const getAccount = oc
  .route({
    method: 'GET',
    path: '/account',
    inputStructure: 'detailed',
    spec: {
      summary: 'Get account information',
      description: 'Retrieve current user account information',
      tags: ['Account'],
      security: [{ cookieAuth: [] }],
    },
  })
  .output(ApiResponseSchema(AccountDataSchema));

/**
 * PATCH /account
 * Update current user's account
 */
export const updateAccount = oc
  .route({
    method: 'PATCH',
    path: '/account',
    inputStructure: 'detailed',
    spec: {
      summary: 'Update account',
      description: 'Update current user account information',
      tags: ['Account'],
      security: [{ cookieAuth: [] }],
    },
  })
  .input(UpdateAccountSchema)
  .output(ApiResponseSchema(AccountUpdateDataSchema));
