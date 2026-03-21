/**
 * Server-injected Zendesk app configuration.
 *
 * The API server at /zendesk/iframe injects window.__ZENDESK_CONFIG__
 * into the HTML at serve time, based on whether an integration exists
 * for the current Zendesk subdomain.
 */

export interface ZendeskConfig {
  apiToken: string;
  workspaceId: string;
  subdomain: string;
}

export interface ZendeskSetupConfig {
  needsSetup: true;
  subdomain: string | null;
}

export type ZendeskWindowConfig = ZendeskConfig | ZendeskSetupConfig;

declare global {
  interface Window {
    __ZENDESK_CONFIG__?: ZendeskWindowConfig;
  }
}

export function getZendeskConfig(): ZendeskWindowConfig {
  return window.__ZENDESK_CONFIG__ ?? { needsSetup: true, subdomain: null };
}

export function isConfigured(config: ZendeskWindowConfig): config is ZendeskConfig {
  return !('needsSetup' in config);
}
