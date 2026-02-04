/**
 * JavaScript Obfuscator Configuration
 *
 * 3-tier obfuscation presets:
 * - npmPreset: Heavy protection for npm registry publishing
 * - cdnPreset: Heavy protection + domain lock for CDN deployment
 *
 * Standard build (no obfuscation) is handled by omitting the plugin.
 */

import type { ObfuscatorOptions } from 'javascript-obfuscator';

/**
 * Reserved names - public API that should remain readable
 * These patterns prevent obfuscation of exported function/class names
 */
const reservedNames = [
  // SDK public API
  '^initialize$',
  '^isInitialized$',
  '^open$',
  '^unmount$',
  '^metadata$',
  '^set$',
  '^clearMetadata$',
  '^isRecorderMounted$',
  '^isBridgeConnected$',
  '^getRecordingState$',
  '^getRecordingContext$',
  '^getSessionId$',
  '^getLinkId$',
  '^getTabRef$',
  '^clearTabRef$',
  // Library name
  '^UserplaneSDK$',
  // Re-exported metadata functions
  '^getCustomMetadata$',
  '^setMetadata$',
  '^clearMetadataFn$',
];

/**
 * Base configuration shared across all obfuscation presets
 */
const baseConfig: ObfuscatorOptions = {
  // String obfuscation
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 5,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 5,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.8,

  // Variable/Function name obfuscation
  identifierNamesGenerator: 'hexadecimal',
  identifiersDictionary: [],
  identifiersPrefix: '',
  renameGlobals: false,
  renameProperties: false,
  renamePropertiesMode: 'safe',

  // Control flow obfuscation
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,

  // Code transformations
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
  splitStrings: true,
  splitStringsChunkLength: 10,

  // Self-defending
  selfDefending: true,

  // Source maps disabled for obfuscated builds
  sourceMap: false,
  sourceMapMode: 'separate',

  // Other
  compact: true,
  simplify: true,
  numbersToExpressions: true,
  shuffleStringArray: true,

  // Performance
  target: 'browser',

  // Reserved names (public API)
  reservedNames,
  reservedStrings: [],

  // Logging
  log: false,
};

/**
 * NPM Preset - Heavy obfuscation for npm registry publishing
 *
 * Features:
 * - All base obfuscation features
 * - Anti-debugging protection enabled
 * - Console output preserved (for debugging issues in production)
 */
export const npmPreset: ObfuscatorOptions = {
  ...baseConfig,
  debugProtection: true,
  debugProtectionInterval: 0,
  disableConsoleOutput: false,
};

/**
 * CDN Preset - Maximum protection for CDN deployment
 *
 * Features:
 * - All NPM preset features
 * - Console output disabled
 * - Domain lock ready (uncomment and configure before CDN deploy)
 */
export const cdnPreset: ObfuscatorOptions = {
  ...npmPreset,
  disableConsoleOutput: true,
  // Domain lock - uncomment and configure for your CDN domains
  // domainLock: ['yourdomain.com', 'cdn.yourdomain.com'],
  // domainLockRedirectUrl: 'about:blank',
};
