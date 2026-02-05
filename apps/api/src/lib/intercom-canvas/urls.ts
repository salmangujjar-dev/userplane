/**
 * Intercom Canvas URL Utilities
 * Centralizes URL formatting for all Intercom canvas views
 */

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
 * Intercom canvas image record keyed by semantic name.
 * Each key maps to a CDN URL for the corresponding canvas image.
 */
export interface CanvasImages {
  logo: string;
  openerRequestRecording: string;
  openerRequestScreenshot: string;
  openerViewRecordings: string;
  openerRequestAccess: string;
  successLinkCreated: string;
  errorGeneric: string;
  accessRequestedLock: string;
  limitExceededUpgrade: string;
}

/**
 * Get image URLs for canvas components
 * These are served from the CDN with content-hash filenames
 */
export function getCanvasImages(): CanvasImages {
  const client = getMediaClient();
  return {
    logo: client.getIntercomCanvasMediaUrl('intercom-canvas/userplane-icon.svg'),
    openerRequestRecording: client.getIntercomCanvasMediaUrl(
      'intercom-canvas/intercom/request-recording.svg'
    ),
    openerRequestScreenshot: client.getIntercomCanvasMediaUrl(
      'intercom-canvas/intercom/request-screenshot.svg'
    ),
    openerViewRecordings: client.getIntercomCanvasMediaUrl(
      'intercom-canvas/intercom/view-recordings.svg'
    ),
    openerRequestAccess: client.getIntercomCanvasMediaUrl(
      'intercom-canvas/intercom/request-access.svg'
    ),
    successLinkCreated: client.getIntercomCanvasMediaUrl('intercom-canvas/intercom/success.svg'),
    errorGeneric: client.getIntercomCanvasMediaUrl('intercom-canvas/intercom/error.svg'),
    accessRequestedLock: client.getIntercomCanvasMediaUrl('intercom-canvas/intercom/lock.svg'),
    limitExceededUpgrade: client.getIntercomCanvasMediaUrl('intercom-canvas/intercom/upgrade.svg'),
  };
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
    return `${baseUrl}/workspace/${workspaceId}/settings?tab=integrations`;
  },

  upgradeWorkspaceURL(workspaceId: string): string {
    return `${baseUrl}/workspace/${workspaceId}/settings?tab=plan-usage&plan-modal=detailed`;
  },

  accessUserSubmittedRecordingsURL(workspaceId: string, workspaceMemberId: string): string {
    return `${baseUrl}/workspace/${workspaceId}/recordings?creators=${workspaceMemberId}`;
  },

  accessAllRecordingsURL(workspaceId: string): string {
    return `${baseUrl}/workspace/${workspaceId}/recordings`;
  },

  supportEmailURL(): string {
    return `mailto:${env.support.supportEmail}`;
  },

  workspaceSuggestURL(): string {
    return `${baseUrl}/workspace/suggest`;
  },
};
