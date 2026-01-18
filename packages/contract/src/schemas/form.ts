import { z } from 'zod';

import { URLSchema } from './common';

/**
 * Form-specific validation schemas
 * These schemas are designed for user-facing forms with trim, required validation, etc.
 * They build on top of the base schemas from common.ts
 */

// ============================================================================
// FORM EMAIL SCHEMA
// ============================================================================

/**
 * Email schema for forms with trim and required validation
 * Builds on top of EmailSchema but adds form-specific validation
 * Use this for user-facing forms (billing email, invite emails, etc.)
 */
export const FormEmailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .transform((value) => {
    // Apply the same normalization as EmailSchema
    const normalized = value.toLowerCase().trim();
    return normalized;
  });

// ============================================================================
// FORM URL SCHEMA
// ============================================================================

/**
 * URL schema for forms with required validation
 * Use this for user-facing forms where URL is required
 */
export const FormURLSchema = z.string().min(1, 'URL is required').pipe(URLSchema);
