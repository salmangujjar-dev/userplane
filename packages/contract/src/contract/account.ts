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
 * GET /api/v1/account
 * Get current user's account information
 */
export const getAccount = oc
  .route({
    method: 'GET',
    path: '/api/v1/account',
    summary: 'Get account information',
    description: 'Retrieve current user account information',
    tags: ['Account'],
  })
  .output(ApiResponseSchema(AccountDataSchema));

/**
 * PATCH /api/v1/account
 * Update current user's account
 */
export const updateAccount = oc
  .route({
    method: 'PATCH',
    path: '/api/v1/account',
    summary: 'Update account',
    description: 'Update current user account information',
    tags: ['Account'],
  })
  .input(UpdateAccountSchema)
  .output(ApiResponseSchema(AccountUpdateDataSchema));
