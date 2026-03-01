/**
 * Account-related types
 * Re-exports from @userplane/contract for type consistency
 */

import type { AccountDataSchema, AccountUpdateDataSchema } from '@userplane/contract';
import type { z } from 'zod';

/**
 * User account data - pinned to contract schema
 */
export type AccountData = z.infer<typeof AccountDataSchema>;

/**
 * Update account name response - pinned to contract schema
 */
export type UpdateAccountData = z.infer<typeof AccountUpdateDataSchema>;
