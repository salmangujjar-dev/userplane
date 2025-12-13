/**
 * Domain validation schemas
 * Schemas for domain verification operations
 */

import { z } from 'zod';

/**
 * Domain verification request schema
 */
export const verifyDomainSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});
