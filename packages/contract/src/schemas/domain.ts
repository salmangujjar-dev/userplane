import { z } from 'zod';

import {
  DomainIdSchema,
  DomainStatusSchema,
  EmailSchema,
  TokenSchema,
  WorkspaceIdSchema,
} from './common';

/**
 * Domain schemas
 */

/**
 * Domain verification request (detailed mode)
 * Accepts multiple workspace IDs (max 10) for SDK flexibility
 */
export const VerifyDomainSchema = z.object({
  body: z.object({
    token: TokenSchema,
    workspaceIds: z.array(WorkspaceIdSchema).min(1).max(10),
  }),
});

/**
 * Domain verification response
 */
export const DomainVerificationDataSchema = z.object({
  domainStatus: DomainStatusSchema,
  workspaceId: WorkspaceIdSchema,
  domainId: DomainIdSchema,
  domainUrl: z.string(),
});

/**
 * Domain recording preferences
 */
export const DomainRecordingPreferencesSchema = z.object({
  recordingHideSensitive: z.boolean(),
  recordingCaptureClientLog: z.boolean(),
  recordingCaptureClientAction: z.boolean(),
  recordingCaptureServerLog: z.boolean(),
  recordingCaptureNetworkLog: z.boolean(),
});

/**
 * Update domain recording preferences request (detailed mode)
 */
export const UpdateDomainRecordingPreferencesSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    domainId: DomainIdSchema,
  }),
  body: z.object({
    recordingHideSensitive: z.boolean().optional(),
    recordingCaptureClientLog: z.boolean().optional(),
    recordingCaptureClientAction: z.boolean().optional(),
    recordingCaptureServerLog: z.boolean().optional(),
    recordingCaptureNetworkLog: z.boolean().optional(),
  }),
});

/**
 * Replace domain recording preferences request (detailed mode)
 */
export const ReplaceDomainRecordingPreferencesSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    domainId: DomainIdSchema,
  }),
  body: z.object({
    recordingHideSensitive: z.boolean(),
    recordingCaptureClientLog: z.boolean(),
    recordingCaptureClientAction: z.boolean(),
    recordingCaptureServerLog: z.boolean(),
    recordingCaptureNetworkLog: z.boolean(),
  }),
});

/**
 * Get domain recording preferences request (detailed mode)
 */
export const GetDomainRecordingPreferencesSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    domainId: DomainIdSchema,
  }),
});

/**
 * Domain recording preferences response
 */
export const DomainRecordingPreferencesDataSchema = z.object({
  domainId: DomainIdSchema,
  workspaceId: WorkspaceIdSchema,
  recordingHideSensitive: z.boolean(),
  recordingCaptureClientLog: z.boolean(),
  recordingCaptureClientAction: z.boolean(),
  recordingCaptureServerLog: z.boolean(),
  recordingCaptureNetworkLog: z.boolean(),
});

/**
 * Domain recording preferences update response
 */
export const DomainRecordingPreferencesUpdateDataSchema = z.object({
  domainId: DomainIdSchema,
  workspaceId: WorkspaceIdSchema,
});

/**
 * Send domain developer instructions request (detailed mode)
 */
export const SendDomainInstructionsSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    domainId: DomainIdSchema,
  }),
  body: z.object({
    emails: z.array(EmailSchema).min(1).max(10),
  }),
});

/**
 * Domain instruction result item
 */
export const DomainInstructionResultItemSchema = z.object({
  email: EmailSchema,
  success: z.boolean(),
  error: z.string().optional(),
});

/**
 * Send domain instructions result response
 */
export const SendDomainInstructionsResultSchema = z.object({
  sent: z.array(DomainInstructionResultItemSchema),
  failed: z.array(DomainInstructionResultItemSchema),
});
