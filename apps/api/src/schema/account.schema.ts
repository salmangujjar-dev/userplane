/**
 * Account validation schemas
 * Schemas for user account operations
 */

import { z } from 'zod';

/**
 * Update account schema
 */
export const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
});
