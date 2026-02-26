// Tab reference
export const TAB_REF_PREFIX = 'userplane_tab_';

// Branding / naming constants
export const LOGGER_NAME = 'userplane-logger';
export const LOGGER_PREFIX = '[Userplane]';
export const CUSTOM_EVENT_NAME = '__userplane_logger';
export const EXTENSION_TAG = 'USERPLANE-EXTENSION';

// Window property keys
export const WIN_LOGGER_LOADED = '__userplane_logger_loaded';
export const WIN_LOGGER_ORIGINALS = '__userplane_logger_originals';
export const WIN_PRISTINE_NATIVES = '__userplane_pristine_natives';
export const WIN_SERVER_DELTA = '__userplane_server_delta_ms';
export const WIN_HAS_FOCUS = '__userplane_has_focus';
export const WIN_REMOVE_NAV_HOOK = '__userplane_removeNavigationApiHook';
export const CONSOLE_PATCHED_FLAG = '__userplane_patched__';

// Default internal endpoint base URLs (both prod and dev).
// Requests matching these are filtered as "internal noise" to prevent
// the logger from logging its own infrastructure traffic.
// Consumers can override via LoggerManager constructor.
export const DEFAULT_INTERNAL_ENDPOINTS: string[] = [
  'https://api.userplane.io',
  'https://app.userplane.io',
  'https://recorder.userplane.io',
  'https://dash.userplane.io',
  'https://api-dev.userplane.io',
  'https://app-dev.userplane.io',
  'https://recorder-dev.userplane.io',
  'https://dash-dev.userplane.io',
];

/**
 * Builds a set of RegExp matchers from a list of base URLs.
 * Each base URL is escaped and matched as a prefix (with optional path/query).
 */
export function buildEndpointMatchers(baseUrls: string[]): RegExp[] {
  return baseUrls.map((base) => {
    const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`^${escaped}(?:[/?].*)?$`, 'i');
  });
}

// Error detection patterns
export const LOGGER_FILE_PATTERNS = ['userplane_logger', 'userplane-logger'];
