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
// EMAIL TAG SCHEMAS (for multi-email input forms)
// ============================================================================

/**
 * Maximum number of email recipients for sharing/invite forms.
 * Kept in sync with server-side array constraints (e.g. ShareRecordingSchema, SendInvitesSchema).
 */
export const MAX_EMAIL_RECIPIENTS = 10;

/**
 * Schema for an individual email tag in a multi-email input.
 * Used by invite-modal, share-recording-modal, and similar forms where
 * users type emails as tags (with per-tag valid/invalid visual feedback).
 */
export const EmailTagSchema = z.object({
  email: z.string(),
  isValid: z.boolean(),
  name: z.string().optional(),
});

export type EmailTag = z.infer<typeof EmailTagSchema>;

/**
 * Schema for the emails field array in multi-email forms.
 * Validates that at least one email is present and at least one is valid.
 */
export const EmailTagsFieldSchema = z
  .array(EmailTagSchema)
  .refine((emails) => emails.length > 0, {
    message: 'At least one email is required',
  })
  .refine((emails) => emails.some((e) => e.isValid), {
    message: 'At least one valid email is required',
  });

/**
 * Checks whether a new email is a duplicate of any existing email tags.
 * Returns the lowercase-trimmed email if unique, or null if duplicate.
 */
export function deduplicateEmail(email: string, existing: Array<{ email: string }>): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return null;
  const isDuplicate = existing.some((e) => e.email.toLowerCase() === trimmed);
  return isDuplicate ? null : trimmed;
}

// ============================================================================
// FORM URL SCHEMA
// ============================================================================

/**
 * URL schema for forms with required validation
 * Use this for user-facing forms where URL is required
 */
export const FormURLSchema = z.string().min(1, 'URL is required').pipe(URLSchema);
