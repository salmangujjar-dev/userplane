import { z } from 'zod';
import { DomainStatusSchema } from './common';

/**
 * Domain schemas
 */

/**
 * Domain verification request (detailed mode)
 */
export const VerifyDomainSchema = z.object({
  body: z.object({
    token: z.string().min(1),
  }),
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
  recordingCaptureNetworkLog: z.boolean(),
});

/**
 * Update domain recording preferences request (detailed mode)
 */
export const UpdateDomainRecordingPreferencesSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
    domainId: z.string(),
  }),
  body: z.object({
    recordingHideSensitive: z.boolean().optional(),
    recordingCaptureClientLog: z.boolean().optional(),
    recordingCaptureServerLog: z.boolean().optional(),
    recordingCaptureNetworkLog: z.boolean().optional(),
  }),
});

/**
 * Replace domain recording preferences request (detailed mode)
 */
export const ReplaceDomainRecordingPreferencesSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
    domainId: z.string(),
  }),
  body: z.object({
    recordingHideSensitive: z.boolean(),
    recordingCaptureClientLog: z.boolean(),
    recordingCaptureServerLog: z.boolean(),
    recordingCaptureNetworkLog: z.boolean(),
  }),
});

/**
 * Get domain recording preferences request (detailed mode)
 */
export const GetDomainRecordingPreferencesSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
    domainId: z.string(),
  }),
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
  recordingCaptureNetworkLog: z.boolean(),
});

/**
 * Domain recording preferences update response
 */
export const DomainRecordingPreferencesUpdateDataSchema = z.object({
  domainId: z.string(),
  workspaceId: z.string(),
});
