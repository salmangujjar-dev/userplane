/**
 * Media Store Registry
 * Asset metadata including labels, alt text, and categorization.
 * Types are derived from the auto-generated manifest for compile-time safety.
 */

import type { AuthAssetKey, IntegrationAssetKey } from './types';

// Derive name types from asset key unions
type IntegrationName = IntegrationAssetKey extends `integrations/${infer Name}.webp` ? Name : never;
type AuthProviderName = AuthAssetKey extends `auth/${infer Name}.png` ? Name : never;

/**
 * Integration asset metadata
 */
export interface IntegrationAsset {
  name: IntegrationName;
  label: string;
  alt: string;
  path: IntegrationAssetKey;
}

// =============================================================================
// Constants
// =============================================================================

const INTEGRATION_NAMES = [
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
] as const satisfies readonly IntegrationName[];

const AUTH_PROVIDER_NAMES = [
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
] as const satisfies readonly AuthProviderName[];

// =============================================================================
// Integration Registry
// =============================================================================

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

export const INTEGRATION_REGISTRY: Record<IntegrationName, IntegrationAsset> = Object.fromEntries(
  INTEGRATION_NAMES.map((name) => {
    const path: IntegrationAssetKey = `integrations/${name}.webp`;
    return [
      name,
      {
        name,
        label: INTEGRATION_LABELS[name],
        alt: `${INTEGRATION_LABELS[name]} Logo`,
        path,
      },
    ];
  })
) as Record<IntegrationName, IntegrationAsset>;

export function getIntegrationAssets(): IntegrationAsset[] {
  return Object.values(INTEGRATION_REGISTRY);
}

export function getIntegrationAsset(name: IntegrationName): IntegrationAsset {
  return INTEGRATION_REGISTRY[name];
}

// =============================================================================
// Auth Provider Registry
// =============================================================================

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

export interface AuthProviderAsset {
  name: AuthProviderName;
  label: string;
  alt: string;
  path: AuthAssetKey;
}

export const AUTH_PROVIDER_REGISTRY: Record<AuthProviderName, AuthProviderAsset> =
  Object.fromEntries(
    AUTH_PROVIDER_NAMES.map((name) => {
      const path: AuthAssetKey = `auth/${name}.png`;
      return [
        name,
        {
          name,
          label: AUTH_PROVIDER_LABELS[name],
          alt: `${AUTH_PROVIDER_LABELS[name]} Logo`,
          path,
        },
      ];
    })
  ) as Record<AuthProviderName, AuthProviderAsset>;

export function getAuthProviderAssets(): AuthProviderAsset[] {
  return Object.values(AUTH_PROVIDER_REGISTRY);
}

export function getAuthProviderAsset(name: AuthProviderName): AuthProviderAsset {
  return AUTH_PROVIDER_REGISTRY[name];
}
