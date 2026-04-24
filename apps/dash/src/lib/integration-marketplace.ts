import { env } from '@/env';
import { CHROME_EXTENSION_MARKETPLACE } from '@/env/defaults';

export const INTEGRATION_MARKETPLACE_PROVIDERS = [
  'zendesk',
  'discord',
  'helpscout',
  'pylon',
  'plain',
  'hubspot',
] as const;

export type IntegrationMarketplaceProvider = (typeof INTEGRATION_MARKETPLACE_PROVIDERS)[number];

export const CHROME_EXTENSION_MARKETPLACE_APP_URL = CHROME_EXTENSION_MARKETPLACE.APP_URL;

export function isIntegrationMarketplaceProvider(
  provider: string
): provider is IntegrationMarketplaceProvider {
  return (INTEGRATION_MARKETPLACE_PROVIDERS as readonly string[]).includes(provider);
}

export function getIntegrationMarketplaceConfig(provider: IntegrationMarketplaceProvider) {
  return env.integrationMarketplaces[provider];
}

export function openIntegrationMarketplace(
  provider: IntegrationMarketplaceProvider,
  options: { respectLive?: boolean } = {}
) {
  const config = getIntegrationMarketplaceConfig(provider);
  if (options.respectLive && !config.live) {
    return;
  }
  window.open(config.appUrl, '_blank');
}
