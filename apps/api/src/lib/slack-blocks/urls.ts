/**
 * Slack Canvas URL Utilities
 * Centralizes URL formatting and CDN image references for all Slack Block Kit views.
 */

import { getMediaClient } from '@/api/clients/media';
import { env } from '@/api/env';

/**
 * Base dashboard URL from environment
 */
const baseUrl = env.dashboard.baseUrl;

// =============================================================================
// Canvas Image Assets (PNG only — Slack Block Kit does not support SVG)
// =============================================================================

/**
 * Image URLs used in Slack Block Kit views.
 * All assets are PNG files served from the CDN via the slack/ namespace.
 */
export interface SlackCanvasImages {
  logo: string;
  successIcon: string;
  errorIcon: string;
  lockIcon: string;
  upgradeIcon: string;
}

/**
 * Get image URLs for Slack canvas components.
 * Uses PNG assets from the slack/ CDN namespace (Slack only supports PNG/JPG/GIF).
 */
export function getSlackCanvasImages(): SlackCanvasImages {
  const client = getMediaClient();
  return {
    logo: client.getSlackMediaUrl('slack/userplane-icon.png'),
    successIcon: client.getSlackMediaUrl('slack/success.png'),
    errorIcon: client.getSlackMediaUrl('slack/error.png'),
    lockIcon: client.getSlackMediaUrl('slack/lock.png'),
    upgradeIcon: client.getSlackMediaUrl('slack/upgrade.png'),
  };
}

// =============================================================================
// URL Builders
// =============================================================================

/**
 * URL builders for links used in Slack Block Kit views.
 */
export const slackCanvasUrls = {
  dashboardUrl(): string {
    return baseUrl;
  },

  settingsIntegrationsUrl(workspaceId: string): string {
    return `${baseUrl}/workspace/${workspaceId}/settings?tab=integrations`;
  },

  upgradeWorkspaceUrl(workspaceId: string): string {
    return `${baseUrl}/workspace/${workspaceId}/settings?tab=plan-usage&plan-modal=detailed`;
  },

  recordingsUrl(workspaceId: string): string {
    return `${baseUrl}/workspace/${workspaceId}/recordings`;
  },

  createLinkUrl(workspaceId: string): string {
    return `${baseUrl}/workspace/${workspaceId}/recordings?create_link=true`;
  },

  linkRecordingsUrl(workspaceId: string, linkId: string): string {
    return `${baseUrl}/workspace/${workspaceId}/recordings?links=${linkId}`;
  },

  userRecordingsUrl(workspaceId: string, memberId: string): string {
    return `${baseUrl}/workspace/${workspaceId}/recordings?creators=${memberId}`;
  },

  supportEmailUrl(): string {
    return `mailto:${env.support.supportEmail}`;
  },

  workspaceSuggestUrl(): string {
    return `${baseUrl}/workspace/suggest`;
  },

  slackAuthorizeUrl(): string {
    return `${baseUrl}/oauth/slack/authorize`;
  },

  signUpUrl(): string {
    return `${baseUrl}/auth`;
  },
};
