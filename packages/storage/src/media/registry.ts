/**
 * Media Store Registry
 * Asset metadata including labels, alt text, and categorization.
 * Types are derived from the auto-generated manifest for compile-time safety.
 */

import type { IntegrationAssetKey } from './types';

// Derive name types from asset key unions
type IntegrationName = IntegrationAssetKey extends `integrations/${infer Name}.webp` ? Name : never;

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

// =============================================================================
// Integration Registry
// =============================================================================

const INTEGRATION_LABELS: Record<IntegrationName, string> = {
  asana: 'Asana',
  chrome: 'Chrome',
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
