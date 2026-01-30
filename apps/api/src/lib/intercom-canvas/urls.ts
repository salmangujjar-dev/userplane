/**
 * Intercom Canvas URL Utilities
 * Centralizes URL formatting for all Intercom canvas views
 */

import { env } from '@/api/env';

/**
 * Base dashboard URL from environment
 */
const baseUrl = env.dashboard.baseUrl;

// =============================================================================
// Canvas Image Assets
// =============================================================================

/**
 * Image URLs for canvas components
 * These are hosted on the dashboard and used across all canvases
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
export const canvasImages = {
  /** Userplane logo - used on signup, connect, recording, link-creator screens */
  logo: `${baseUrl}/img/userplane-icon.png`,
  /** Request recording icon - opener screen list item */
  openerRequestRecording: `${baseUrl}/img/intercom/request-recording.png`,
  /** View recordings icon - opener screen list item */
  openerViewRecordings: `${baseUrl}/img/intercom/view-recordings.png`,
  /** Success checkmark - success screen after link creation */
  successLinkCreated: `${baseUrl}/img/intercom/success.png`,
  /** Error icon - generic error screens */
  errorGeneric: `${baseUrl}/img/intercom/error.png`,
  /** Lock icon - access-requested screen */
  accessRequestedLock: `${baseUrl}/img/intercom/lock.png`,
  /** Upgrade icon - limit-exceeded screen */
  limitExceededUpgrade: `${baseUrl}/img/intercom/upgrade.png`,
} as const;

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
};
