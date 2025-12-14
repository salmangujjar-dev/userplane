/**
 * Domain validation schemas
 * Schemas for domain verification and recording preferences
 */

import { z } from 'zod';

/**
 * Domain verification request schema
 */
export const verifyDomainSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

/**
 * Update domain recording preferences schema
 * Schema for toggling recording behavior preferences at domain level
 */
export const updateDomainRecordingPreferencesSchema = z.object({
  recordingHideSensitive: z.boolean().optional(),
  recordingCaptureClientLog: z.boolean().optional(),
  recordingCaptureServerLog: z.boolean().optional(),
});
