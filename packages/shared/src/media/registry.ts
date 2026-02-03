/**
 * Media Store Registry
 * Asset metadata including labels, alt text, and categorization
 */

import { AUTH_PATHS, AUTH_PROVIDER_NAMES, INTEGRATION_NAMES, INTEGRATION_PATHS } from './paths';
import type { AuthProviderName, IntegrationAsset, IntegrationName } from './types';

// =============================================================================
// Integration Registry
// =============================================================================

/**
 * Human-readable labels for integrations
 */
const INTEGRATION_LABELS: Record<IntegrationName, string> = {
  asana: 'Asana',
  clickup: 'ClickUp',
  crisp: 'Crisp',
  discord: 'Discord',
  freshchat: 'Freshchat',
  freshdesk: 'Freshdesk',
  front: 'Front',
  happyfox: 'HappyFox',
  helpscout: 'Help Scout',
  hiver: 'Hiver',
  hubspot: 'HubSpot',
  intercom: 'Intercom',
  jira: 'Jira',
  jiraservicedesk: 'Jira Service Desk',
  linear: 'Linear',
  make: 'Make',
  n8n: 'n8n',
  notion: 'Notion',
  plain: 'Plain',
  pylon: 'Pylon',
  salesforce: 'Salesforce',
  sentry: 'Sentry',
  slack: 'Slack',
  talkdesk: 'Talkdesk',
  zapier: 'Zapier',
  zendesk: 'Zendesk',
  zoho: 'Zoho',
} as const;

/**
 * Integration asset registry with full metadata
 */
export const INTEGRATION_REGISTRY: Record<IntegrationName, IntegrationAsset> = Object.fromEntries(
  INTEGRATION_NAMES.map((name) => [
    name,
    {
      name,
      label: INTEGRATION_LABELS[name],
      alt: `${INTEGRATION_LABELS[name]} Logo`,
      path: INTEGRATION_PATHS[name],
    },
  ])
) as Record<IntegrationName, IntegrationAsset>;

/**
 * Get all integration assets as an array
 * Useful for rendering integration logo grids
 *
 * @example
 * ```typescript
 * const logos = getIntegrationAssets();
 * // [{ name: 'asana', label: 'Asana', alt: 'Asana Logo', path: '/integrations/asana.webp' }, ...]
 * ```
 */
export function getIntegrationAssets(): IntegrationAsset[] {
  return Object.values(INTEGRATION_REGISTRY);
}

/**
 * Get a single integration asset by name
 *
 * @param name - Integration name
 * @returns Integration asset metadata
 */
export function getIntegrationAsset(name: IntegrationName): IntegrationAsset {
  return INTEGRATION_REGISTRY[name];
}

// =============================================================================
// Auth Provider Registry
// =============================================================================

/**
 * Human-readable labels for auth providers
 */
const AUTH_PROVIDER_LABELS: Record<AuthProviderName, string> = {
  crisp: 'Crisp',
  discord: 'Discord',
  freshdesk: 'Freshdesk',
  happyfox: 'HappyFox',
  helpscout: 'Help Scout',
  hiver: 'Hiver',
  intercom: 'Intercom',
  jira: 'Jira',
  linear: 'Linear',
  pylon: 'Pylon',
  slack: 'Slack',
  zendesk: 'Zendesk',
} as const;

/**
 * Auth provider asset metadata
 */
export interface AuthProviderAsset {
  /** Machine-readable name */
  name: AuthProviderName;
  /** Human-readable label */
  label: string;
  /** Alt text for accessibility */
  alt: string;
  /** Relative path to the asset */
  path: string;
}

/**
 * Auth provider asset registry with full metadata
 */
export const AUTH_PROVIDER_REGISTRY: Record<AuthProviderName, AuthProviderAsset> =
  Object.fromEntries(
    AUTH_PROVIDER_NAMES.map((name) => [
      name,
      {
        name,
        label: AUTH_PROVIDER_LABELS[name],
        alt: `${AUTH_PROVIDER_LABELS[name]} Logo`,
        path: AUTH_PATHS[name],
      },
    ])
  ) as Record<AuthProviderName, AuthProviderAsset>;

/**
 * Get all auth provider assets as an array
 */
export function getAuthProviderAssets(): AuthProviderAsset[] {
  return Object.values(AUTH_PROVIDER_REGISTRY);
}

/**
 * Get a single auth provider asset by name
 */
export function getAuthProviderAsset(name: AuthProviderName): AuthProviderAsset {
  return AUTH_PROVIDER_REGISTRY[name];
}
