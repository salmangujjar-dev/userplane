/**
 * Shared domain-related types and utilities
 */

export interface DomainSettings {
  hideSensitiveFields: boolean;
  captureConsoleLogs: boolean;
  captureClientActions: boolean;
  captureNetworkLogs: boolean;
  captureBackendServerLogs: boolean;
}

export const DEFAULT_DOMAIN_SETTINGS: DomainSettings = {
  hideSensitiveFields: false,
  captureConsoleLogs: false,
  captureClientActions: false,
  captureNetworkLogs: false,
  captureBackendServerLogs: false,
};

export type DomainStatus = 'pending' | 'verified' | 'revoked';

export interface DomainIdentifier {
  id: string;
  url: string;
}

export interface ConfiguringDomain {
  domainId: string;
  url: string;
  status: DomainStatus;
  settings: DomainSettings | null;
}

/**
 * Transform API preferences response to DomainSettings
 */
export function transformApiPreferencesToSettings(preferences: {
  recordingHideSensitive: boolean;
  recordingCaptureClientLog: boolean;
  recordingCaptureClientAction: boolean;
  recordingCaptureNetworkLog: boolean;
  recordingCaptureServerLog: boolean;
}): DomainSettings {
  return {
    hideSensitiveFields: preferences.recordingHideSensitive,
    captureConsoleLogs: preferences.recordingCaptureClientLog,
    captureClientActions: preferences.recordingCaptureClientAction,
    captureNetworkLogs: preferences.recordingCaptureNetworkLog,
    captureBackendServerLogs: preferences.recordingCaptureServerLog,
  };
}

/**
 * Transform DomainSettings to API preferences format
 */
export function transformSettingsToApiPreferences(settings: DomainSettings): {
  recordingHideSensitive: boolean;
  recordingCaptureClientLog: boolean;
  recordingCaptureClientAction: boolean;
  recordingCaptureNetworkLog: boolean;
  recordingCaptureServerLog: boolean;
} {
  return {
    recordingHideSensitive: settings.hideSensitiveFields,
    recordingCaptureClientLog: settings.captureConsoleLogs,
    recordingCaptureClientAction: settings.captureClientActions,
    recordingCaptureNetworkLog: settings.captureNetworkLogs,
    recordingCaptureServerLog: settings.captureBackendServerLogs,
  };
}

/**
 * Format domain URL for display with path highlighting
 * Returns an object with domain and path parts for flexible rendering
 */
export function formatDomainUrl(domainUrl: string): {
  domain: string;
  path: string | null;
  hasPath: boolean;
} {
  if (domainUrl.includes('/')) {
    const parts = domainUrl.split('/');
    return {
      domain: parts[0] + '/',
      path: parts.slice(1).join('/'),
      hasPath: true,
    };
  }
  return {
    domain: domainUrl,
    path: null,
    hasPath: false,
  };
}
