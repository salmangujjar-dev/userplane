/**
 * Intercom Canvas URL Utilities
 * Centralizes URL formatting for all Intercom canvas views
 */

import type { IntercomCanvasImageName } from '@workspace/shared/media';

import { getMediaClient } from '@/api/clients/media';
import { env } from '@/api/env';

/**
 * Base dashboard URL from environment
 */
const baseUrl = env.dashboard.baseUrl;

// =============================================================================
// Canvas Image Assets
// =============================================================================

/**
 * Get image URLs for canvas components
 * These are served from the CDN with content-hash filenames
 *
 * Each image is named for the specific screen/context it's used in:
 * - logo: Branding header on signup, connect, recording, link-creator screens
 * - openerRequestRecording: List item icon on opener screen (inbox app)
 * - openerViewRecordings: List item icon on opener screen (inbox app)
 * - successLinkCreated: Header icon on success screen after link creation
 * - errorGeneric: Header icon on error screens
 * - accessRequestedLock: Header icon on access-requested screen
 * - limitExceededUpgrade: Header icon on limit-exceeded screen
 */
export function getCanvasImages(): Record<IntercomCanvasImageName, string> {
  return getMediaClient().intercomCanvas.all();
}

/**
 * URL builder options
 */
export interface IntercomCanvasUrls {
  /**
   * URL for sign up / authentication page
   */
  signUpURL(): string;

  /**
   * URL for integration setup page
   */
  integrateWorkspaceURL(): string;

  /**
   * URL for integration setup page for a specific workspace
   * @param workspaceId - The workspace ID
   */
  integrateWorkspaceURLWithWorkspace(workspaceId: string): string;

  /**
   * URL for billing/upgrade page
   * @param workspaceId - The workspace ID
   */
  upgradeWorkspaceURL(workspaceId: string): string;

  /**
   * URL for recordings page filtered by creator
   * @param workspaceId - The workspace ID
   * @param workspaceMemberId - The workspace member ID to filter by
   */
  accessUserSubmittedRecordingsURL(workspaceId: string, workspaceMemberId: string): string;

  /**
   * URL for recordings page without filter
   * @param workspaceId - The workspace ID
   */
  accessAllRecordingsURL(workspaceId: string): string;

  /**
   * URL for support email contact
   */
  supportEmailURL(): string;

  /**
   * URL for workspace suggestions page where users can join/request access
   */
  workspaceSuggestURL(): string;
}

/**
 * Intercom canvas URL builder
 * Provides consistent URL formatting for all canvas views
 */
export const intercomCanvasUrls: IntercomCanvasUrls = {
  signUpURL(): string {
    return `${baseUrl}/auth`;
  },

  integrateWorkspaceURL(): string {
    return `${baseUrl}/settings?tab=integrations`;
  },

  integrateWorkspaceURLWithWorkspace(workspaceId: string): string {
    return `${baseUrl}/${workspaceId}/settings?tab=integrations`;
  },

  upgradeWorkspaceURL(workspaceId: string): string {
    return `${baseUrl}/${workspaceId}/settings?tab=plan-usage&plan-modal=detailed`;
  },

  accessUserSubmittedRecordingsURL(workspaceId: string, workspaceMemberId: string): string {
    return `${baseUrl}/${workspaceId}/recordings?creators=${workspaceMemberId}`;
  },

  accessAllRecordingsURL(workspaceId: string): string {
    return `${baseUrl}/${workspaceId}/recordings`;
  },

  supportEmailURL(): string {
    return `mailto:${env.support.supportEmail}`;
  },

  workspaceSuggestURL(): string {
    return `${baseUrl}/workspace/suggest`;
  },
};
