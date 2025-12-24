import { oc } from '@orpc/contract';
import {
  AccountDataSchema,
  UpdateAccountSchema,
  AccountUpdateDataSchema,
  ApiResponseSchema,
  AccountErrors,
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
    summary: 'Get account information',
    description: 'Retrieve current user account information',
    tags: ['Account'],
  })
  .errors({
    USER_NOT_FOUND: AccountErrors.USER_NOT_FOUND,
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
    summary: 'Update account',
    description: 'Update current user account information',
    tags: ['Account'],
  })
  .errors({
    USER_NOT_FOUND: AccountErrors.USER_NOT_FOUND,
    USER_NAME_REQUIRED: AccountErrors.USER_NAME_REQUIRED,
  })
  .input(UpdateAccountSchema)
  .output(ApiResponseSchema(AccountUpdateDataSchema));
