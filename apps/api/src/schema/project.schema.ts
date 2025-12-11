/**
 * Project validation schemas
 * Schemas for project operations
 */

import { z } from 'zod';

/**
 * Create project schema
 */
export const createProjectSchema = z.object({
  projectTitle: z.string().optional().nullable(),
});

/**
 * Update project schema
 */
export const updateProjectSchema = z.object({
  isDefault: z.boolean().optional(),
  projectTitle: z.string().optional().nullable(),
});

/**
 * Replace project schema
 */
export const replaceProjectSchema = z.object({
  projectTitle: z.string().nullable(),
  isDefault: z.boolean(),
});
