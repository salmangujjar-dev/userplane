/**
 * Account-related types
 * Re-exports from @workspace/contract for type consistency
 */

import type { AccountDataSchema, AccountUpdateDataSchema } from '@workspace/contract';
import type { z } from 'zod';

/**
 * User account data - pinned to contract schema
 */
export type AccountData = z.infer<typeof AccountDataSchema>;

/**
 * Update account name response - pinned to contract schema
 */
export type UpdateAccountData = z.infer<typeof AccountUpdateDataSchema>;
