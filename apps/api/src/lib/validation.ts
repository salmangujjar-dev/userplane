/**
 * Reusable Zod validation schemas
 * Centralized validation rules for consistent validation across the app
 */

import { z } from 'zod';

/**
 * URL validation schema
 * Accepts any valid URL format (with or without path, query params, etc.)
 */
export const urlSchema = z.string().url('Invalid URL format');

/**
 * Email validation schema
 */
export const emailSchema = z.string().email('Invalid email address');

/**
 * Array of emails validation schema
 */
export const emailArraySchema = z.array(emailSchema).min(1, 'At least one email is required');

/**
 * Workspace slug validation schema
 */
export const workspaceSlugSchema = z
  .string()
  .min(1, 'Workspace slug is required')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format');

/**
 * Non-empty string validation
 */
export const nonEmptyString = z.string().min(1, 'Field is required');
