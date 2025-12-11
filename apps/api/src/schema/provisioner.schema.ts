/**
 * Provisioner validation schemas
 * Schemas for workspace provisioning operations
 */

import { z } from 'zod';
import { urlSchema } from '@/api/lib/validation';

/**
 * Create workspace schema
 */
export const createWorkspaceSchema = z.object({
  url: urlSchema,
});
