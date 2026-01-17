import { z } from 'zod';

/**
 * Account schemas
 */

// ============================================================================
// ACCOUNT-SPECIFIC VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for account name validation
 * Trims whitespace and validates the trimmed value
 */
export const AccountNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters');

// ============================================================================
// ACCOUNT DATA SCHEMAS
// ============================================================================

/**
 * Account data response
 */
export const AccountDataSchema = z.object({
  userName: z.string(),
  userEmail: z.string().email(),
});

/**
 * Update account request (detailed mode)
 */
export const UpdateAccountSchema = z.object({
  body: z.object({
    name: AccountNameSchema,
  }),
});

/**
 * Account update response
 */
export const AccountUpdateDataSchema = z.object({
  userName: z.string(),
});
