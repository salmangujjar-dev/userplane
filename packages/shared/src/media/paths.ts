/**
 * Media Store Paths
 * Relative path constants for all media assets
 */

import type {
  AuthProviderName,
  IntegrationName,
  IntercomCanvasImageName,
  ThemeVariant,
  TileName,
} from './types';

// =============================================================================
// Brand Paths
// =============================================================================

/**
 * Brand asset paths
 */
export const BRAND_PATHS = {
  /** Get logo path for a theme variant */
  logo: (theme: ThemeVariant): string => `/logo-${theme}.svg`,
  /** Favicon path */
  favicon: '/favicon.svg',
} as const;

// =============================================================================
// Tile Paths
// =============================================================================

/**
 * All tile asset names
 */
export const TILE_NAMES: readonly TileName[] = [
  'browsercursor',
  'bubble',
  'documentation',
  'fin',
  'intercom',
  'letterbox',
  'lighthouse',
  'magf',
  'meetview',
  'paperplane',
  'pointer',
  'ring',
] as const;

/**
 * Tile asset paths
 */
export const TILE_PATHS: Record<TileName, string> = {
  browsercursor: '/tile/browsercursor.png',
  bubble: '/tile/bubble.png',
  documentation: '/tile/documentation.png',
  fin: '/tile/fin.png',
  intercom: '/tile/intercom.png',
  letterbox: '/tile/letterbox.png',
  lighthouse: '/tile/lighthouse.png',
  magf: '/tile/magf.png',
  meetview: '/tile/meetview.png',
  paperplane: '/tile/paperplane.png',
  pointer: '/tile/pointer.png',
  ring: '/tile/ring.png',
} as const;

/**
 * Get tile path by name
 */
export function getTilePath(name: TileName): string {
  return TILE_PATHS[name];
}

// =============================================================================
// Integration Paths
// =============================================================================

/**
 * All integration asset names
 */
export const INTEGRATION_NAMES: readonly IntegrationName[] = [
  'asana',
  'clickup',
  'crisp',
  'discord',
  'freshchat',
  'freshdesk',
  'front',
  'happyfox',
  'helpscout',
  'hiver',
  'hubspot',
  'intercom',
  'jira',
  'jiraservicedesk',
  'linear',
  'make',
  'n8n',
  'notion',
  'plain',
  'pylon',
  'salesforce',
  'sentry',
  'slack',
  'talkdesk',
  'zapier',
  'zendesk',
  'zoho',
] as const;

/**
 * Integration asset paths
 */
export const INTEGRATION_PATHS: Record<IntegrationName, string> = {
  asana: '/integrations/asana.webp',
  clickup: '/integrations/clickup.webp',
  crisp: '/integrations/crisp.webp',
  discord: '/integrations/discord.webp',
  freshchat: '/integrations/freshchat.webp',
  freshdesk: '/integrations/freshdesk.webp',
  front: '/integrations/front.webp',
  happyfox: '/integrations/happyfox.webp',
  helpscout: '/integrations/helpscout.webp',
  hiver: '/integrations/hiver.webp',
  hubspot: '/integrations/hubspot.webp',
  intercom: '/integrations/intercom.webp',
  jira: '/integrations/jira.webp',
  jiraservicedesk: '/integrations/jiraservicedesk.webp',
  linear: '/integrations/linear.webp',
  make: '/integrations/make.webp',
  n8n: '/integrations/n8n.webp',
  notion: '/integrations/notion.webp',
  plain: '/integrations/plain.webp',
  pylon: '/integrations/pylon.webp',
  salesforce: '/integrations/salesforce.webp',
  sentry: '/integrations/sentry.webp',
  slack: '/integrations/slack.webp',
  talkdesk: '/integrations/talkdesk.webp',
  zapier: '/integrations/zapier.webp',
  zendesk: '/integrations/zendesk.webp',
  zoho: '/integrations/zoho.webp',
} as const;

/**
 * Get integration path by name
 */
export function getIntegrationPath(name: IntegrationName): string {
  return INTEGRATION_PATHS[name];
}

// =============================================================================
// Auth Paths
// =============================================================================

/**
 * All auth provider asset names
 */
export const AUTH_PROVIDER_NAMES: readonly AuthProviderName[] = [
  'crisp',
  'discord',
  'freshdesk',
  'happyfox',
  'helpscout',
  'hiver',
  'intercom',
  'jira',
  'linear',
  'pylon',
  'slack',
  'zendesk',
] as const;

/**
 * Auth provider asset paths
 */
export const AUTH_PATHS: Record<AuthProviderName, string> = {
  crisp: '/auth/crisp.png',
  discord: '/auth/discord.png',
  freshdesk: '/auth/freshdesk.png',
  happyfox: '/auth/happyfox.png',
  helpscout: '/auth/helpscout.png',
  hiver: '/auth/hiver.png',
  intercom: '/auth/intercom.png',
  jira: '/auth/jira.png',
  linear: '/auth/linear.png',
  pylon: '/auth/pylon.png',
  slack: '/auth/slack.png',
  zendesk: '/auth/zendesk.png',
} as const;

/**
 * Get auth provider icon path by name
 */
export function getAuthPath(name: AuthProviderName): string {
  return AUTH_PATHS[name];
}

// =============================================================================
// Intercom Canvas Paths
// =============================================================================

/**
 * All intercom canvas image names
 */
export const INTERCOM_CANVAS_IMAGE_NAMES: readonly IntercomCanvasImageName[] = [
  'logo',
  'openerRequestRecording',
  'openerViewRecordings',
  'successLinkCreated',
  'errorGeneric',
  'accessRequestedLock',
  'limitExceededUpgrade',
] as const;

/**
 * Intercom canvas image paths
 * These are served from the dashboard app's /img directory
 */
export const INTERCOM_CANVAS_PATHS: Record<IntercomCanvasImageName, string> = {
  /** Userplane logo - used on signup, connect, recording, link-creator screens */
  logo: '/img/userplane-icon.png',
  /** Request recording icon - opener screen list item */
  openerRequestRecording: '/img/intercom/request-recording.png',
  /** View recordings icon - opener screen list item */
  openerViewRecordings: '/img/intercom/view-recordings.png',
  /** Success checkmark - success screen after link creation */
  successLinkCreated: '/img/intercom/success.png',
  /** Error icon - generic error screens */
  errorGeneric: '/img/intercom/error.png',
  /** Lock icon - access-requested screen */
  accessRequestedLock: '/img/intercom/lock.png',
  /** Upgrade icon - limit-exceeded screen */
  limitExceededUpgrade: '/img/intercom/upgrade.png',
} as const;

/**
 * Get intercom canvas image path by name
 */
export function getIntercomCanvasPath(name: IntercomCanvasImageName): string {
  return INTERCOM_CANVAS_PATHS[name];
}
