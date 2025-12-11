/**
 * Invite validation schemas
 * Schemas for invitation operations
 */

import { z } from 'zod';
import { emailArraySchema, nonEmptyString } from '@/api/lib/validation';

/**
 * Send invites schema
 */
export const sendInvitesSchema = z.object({
  emails: emailArraySchema,
});

/**
 * Token query schema
 */
export const tokenQuerySchema = z.object({
  token: nonEmptyString,
});
