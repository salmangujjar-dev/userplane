/**
 * Intercom Canvas Kit Utilities
 *
 * DRY utilities for Intercom integration:
 * - Conversation URL/title builders
 * - Form value extraction
 * - Component ID constants
 * - Teammate name resolution
 */

import { z } from 'zod';

import type { CanvasInputValues, IntercomTeammate } from '@/api/types/intercom-canvas';

// =============================================================================
// Component IDs (typed constants for submit handlers)
// =============================================================================

/**
 * Inbox app component IDs
 * Used for type-safe routing in handleInboxSubmit
 */
export const InboxComponentId = {
  REQUEST_RECORDING: 'request_recording',
  CREATE_LINK: 'create_link',
  GO_BACK: 'go_back',
  DONE: 'done',
  RETRY: 'retry',
  CREATE_ANOTHER: 'create_another',
} as const;

export type InboxComponentId = (typeof InboxComponentId)[keyof typeof InboxComponentId];

/**
 * Configure flow component IDs
 * Used for type-safe routing in handleConfigure
 */
export const ConfigureComponentId = {
  CREATE_LINK: 'create_link',
  GO_BACK: 'go_back',
} as const;

export type ConfigureComponentId = (typeof ConfigureComponentId)[keyof typeof ConfigureComponentId];

/**
 * Form field IDs (matching canvas component IDs)
 */
export const FormFieldId = {
  PROJECT_ID: 'project_id',
  DOMAIN_ID: 'domain_id',
  CUSTOM_MESSAGE: 'custom_message',
} as const;

// =============================================================================
// Intercom Conversation Utilities
// =============================================================================

/**
 * Build Intercom conversation URL from workspace and conversation IDs
 */
export function buildIntercomConversationUrl(
  intercomWorkspaceId: string,
  conversationId: string | undefined
): string {
  return `https://app.intercom.com/a/inbox/${intercomWorkspaceId}/inbox/shared/all/conversation/${conversationId}`;
}

/**
 * Build Intercom conversation title from conversation ID
 */
export function buildIntercomConversationTitle(conversationId: string | undefined): string {
  return `Intercom #${conversationId}`;
}

/**
 * Intercom conversation reference data for link creation
 */
export interface IntercomConversationRef {
  url: string;
  title: string;
  id: string | undefined;
}

/**
 * Build conversation reference from Intercom context
 */
export function buildIntercomConversationRef(
  intercomWorkspaceId: string,
  conversationId: string | undefined
): IntercomConversationRef {
  return {
    id: conversationId,
    url: buildIntercomConversationUrl(intercomWorkspaceId, conversationId),
    title: buildIntercomConversationTitle(conversationId),
  };
}

// =============================================================================
// Teammate Utilities
// =============================================================================

/**
 * Get display name for teammate (fallback to email)
 */
export function getTeammateDisplayName(teammate: IntercomTeammate): string {
  return teammate.name || teammate.email;
}

/**
 * Generate default recording request message with teammate's name
 */
export function generateRecordingRequestMessage(teammate: IntercomTeammate): string {
  const name = getTeammateDisplayName(teammate);
  return `${name} has requested a screen recording`;
}

/**
 * Generate recording request message with "from you" suffix (for inbox flow)
 */
export function generateRecordingRequestMessageForInbox(teammate: IntercomTeammate): string {
  const name = getTeammateDisplayName(teammate);
  return `${name} has requested a screen recording from you`;
}

// =============================================================================
// Form Value Extraction
// =============================================================================

/**
 * Schema for link creator form values
 */
export const LinkCreatorFormSchema = z.object({
  project_id: z.string().min(1, 'Project is required'),
  domain_id: z.string().min(1, 'Domain is required'),
  custom_message: z.string().optional(),
});

export type LinkCreatorFormValues = z.infer<typeof LinkCreatorFormSchema>;

/**
 * Extract and validate link creator form values from canvas input
 *
 * @param inputValues - Raw input values from Intercom canvas
 * @returns Validated form values or null if invalid
 */
export function extractLinkCreatorFormValues(
  inputValues: CanvasInputValues | undefined
): LinkCreatorFormValues | null {
  if (!inputValues) {
    return null;
  }

  const result = LinkCreatorFormSchema.safeParse({
    project_id: inputValues[FormFieldId.PROJECT_ID],
    domain_id: inputValues[FormFieldId.DOMAIN_ID],
    custom_message: inputValues[FormFieldId.CUSTOM_MESSAGE],
  });

  if (!result.success) {
    return null;
  }

  return result.data;
}

/**
 * Get the message to use for the recording canvas
 * Uses custom message if provided, otherwise generates default
 */
export function resolveRecordingMessage(
  customMessage: string | undefined,
  teammate: IntercomTeammate,
  variant: 'configure' | 'inbox' = 'configure'
): string {
  if (customMessage?.trim()) {
    return customMessage.trim();
  }

  return variant === 'inbox'
    ? generateRecordingRequestMessageForInbox(teammate)
    : generateRecordingRequestMessage(teammate);
}
