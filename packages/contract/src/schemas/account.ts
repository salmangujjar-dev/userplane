import { z } from 'zod';

/**
 * Account schemas
 */

/**
 * Account data response
 */
export const AccountDataSchema = z.object({
  userName: z.string(),
  userEmail: z.string().email(),
});

/**
 * Update account request
 */
export const UpdateAccountSchema = z.object({
  name: z.string().min(1).trim(),
});

/**
 * Account update response
 */
export const AccountUpdateDataSchema = z.object({
  userName: z.string(),
});
