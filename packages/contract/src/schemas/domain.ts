import { z } from 'zod';
import { DomainStatusSchema } from './common';

/**
 * Domain schemas
 */

/**
 * Domain verification request
 */
export const VerifyDomainSchema = z.object({
  token: z.string().min(1),
});

/**
 * Domain verification response
 */
export const DomainVerificationDataSchema = z.object({
  domainStatus: DomainStatusSchema,
  workspaceId: z.string(),
  domainId: z.string(),
  domainUrl: z.string(),
});

/**
 * Domain recording preferences
 */
export const DomainRecordingPreferencesSchema = z.object({
  recordingHideSensitive: z.boolean(),
  recordingCaptureClientLog: z.boolean(),
  recordingCaptureServerLog: z.boolean(),
});

/**
 * Update domain recording preferences request
 */
export const UpdateDomainRecordingPreferencesSchema = z.object({
  recordingHideSensitive: z.boolean().optional(),
  recordingCaptureClientLog: z.boolean().optional(),
  recordingCaptureServerLog: z.boolean().optional(),
});

/**
 * Replace domain recording preferences request
 */
export const ReplaceDomainRecordingPreferencesSchema = z.object({
  recordingHideSensitive: z.boolean(),
  recordingCaptureClientLog: z.boolean(),
  recordingCaptureServerLog: z.boolean(),
});

/**
 * Domain recording preferences response
 */
export const DomainRecordingPreferencesDataSchema = z.object({
  domainId: z.string(),
  workspaceId: z.string(),
  recordingHideSensitive: z.boolean(),
  recordingCaptureClientLog: z.boolean(),
  recordingCaptureServerLog: z.boolean(),
});

/**
 * Domain recording preferences update response
 */
export const DomainRecordingPreferencesUpdateDataSchema = z.object({
  domainId: z.string(),
  workspaceId: z.string(),
});
