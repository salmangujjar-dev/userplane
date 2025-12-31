/**
 * Shared Storybook configuration for RecordingPreferences controls
 * Provides flattened args for better control panel experience
 */

import {
  DEFAULT_RECORDING_PREFERENCES,
  type RecordingPreferences,
} from '@/types/session-preferences';

/**
 * Flattened preference args for Storybook controls
 */
export interface PreferenceArgs {
  // Branding
  customizeLink: boolean;
  companyName: string;
  companyLogoUrl: string | null;
  primaryColor: string;
  headerText: string;
  footnoteText: string | null;
  // Recording options
  hideSensitive: boolean;
  captureClientLog: boolean;
  captureClientAction: boolean;
  captureServerLog: boolean;
  captureNetworkLog: boolean;
  maxDurationMs: number;
}

/**
 * ArgTypes definition for preference controls
 */
export const preferenceArgTypes = {
  // Branding controls
  customizeLink: {
    control: 'boolean',
    description: 'Enable custom branding (logo, colors, text)',
    table: { category: 'Branding' },
  },
  companyName: {
    control: 'text',
    description: 'Company name shown in footer',
    table: { category: 'Branding' },
  },
  companyLogoUrl: {
    control: 'text',
    description: 'URL for custom logo (leave empty for default)',
    table: { category: 'Branding' },
  },
  primaryColor: {
    control: 'color',
    description: 'Primary brand color for buttons',
    table: { category: 'Branding' },
  },
  headerText: {
    control: 'text',
    description: 'Header text shown on pre-recording screen',
    table: { category: 'Branding' },
  },
  footnoteText: {
    control: 'text',
    description: 'Footnote text in footer',
    table: { category: 'Branding' },
  },
  // Recording option controls
  hideSensitive: {
    control: 'boolean',
    description: 'Hide sensitive data during recording',
    table: { category: 'Recording Options' },
  },
  captureClientLog: {
    control: 'boolean',
    description: 'Capture client-side console logs',
    table: { category: 'Recording Options' },
  },
  captureClientAction: {
    control: 'boolean',
    description: 'Capture user interactions',
    table: { category: 'Recording Options' },
  },
  captureServerLog: {
    control: 'boolean',
    description: 'Capture server logs',
    table: { category: 'Recording Options' },
  },
  captureNetworkLog: {
    control: 'boolean',
    description: 'Capture network requests',
    table: { category: 'Recording Options' },
  },
  maxDurationMs: {
    control: { type: 'number', min: 60000, max: 600000, step: 60000 },
    description: 'Maximum recording duration in milliseconds',
    table: { category: 'Recording Options' },
  },
} as const;

/**
 * Default args for preferences
 */
export const defaultPreferenceArgs: PreferenceArgs = {
  customizeLink: DEFAULT_RECORDING_PREFERENCES.customizeLink,
  companyName: DEFAULT_RECORDING_PREFERENCES.companyName,
  companyLogoUrl: DEFAULT_RECORDING_PREFERENCES.companyLogoUrl,
  primaryColor: DEFAULT_RECORDING_PREFERENCES.primaryColor,
  headerText: DEFAULT_RECORDING_PREFERENCES.headerText,
  footnoteText: DEFAULT_RECORDING_PREFERENCES.footnoteText,
  hideSensitive: DEFAULT_RECORDING_PREFERENCES.hideSensitive,
  captureClientLog: DEFAULT_RECORDING_PREFERENCES.captureClientLog,
  captureClientAction: DEFAULT_RECORDING_PREFERENCES.captureClientAction,
  captureServerLog: DEFAULT_RECORDING_PREFERENCES.captureServerLog,
  captureNetworkLog: DEFAULT_RECORDING_PREFERENCES.captureNetworkLog,
  maxDurationMs: DEFAULT_RECORDING_PREFERENCES.maxDurationMs,
};

/**
 * Convert flattened args back to RecordingPreferences object
 */
export function argsToPreferences(args: PreferenceArgs): RecordingPreferences {
  return {
    customizeLink: args.customizeLink,
    companyName: args.companyName,
    companyLogoUrl: args.companyLogoUrl || null,
    primaryColor: args.primaryColor,
    headerText: args.headerText,
    footnoteText: args.footnoteText || null,
    hideSensitive: args.hideSensitive,
    captureClientLog: args.captureClientLog,
    captureClientAction: args.captureClientAction,
    captureServerLog: args.captureServerLog,
    captureNetworkLog: args.captureNetworkLog,
    maxDurationMs: args.maxDurationMs,
    requestedBy: null,
  };
}
