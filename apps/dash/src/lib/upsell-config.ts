import type { FeatureGate, FeatureLimit } from '@userplane/pricing';

interface UpsellConfig {
  title: string;
  subtitle: string;
}

export const UPSELL_CONFIGS: Partial<Record<FeatureGate, UpsellConfig>> = {
  customizeRecordingLink: {
    title: 'Customize Your Brand',
    subtitle: 'Add your logo, colors, and messaging to recording links',
  },
  customizeRetentionPolicy: {
    title: 'Customize Data Retention',
    subtitle: 'Set custom retention periods for recordings to meet your compliance needs',
  },
  captureConsoleLog: {
    title: 'Capture Console Logs',
    subtitle: 'Debug faster with full console output from user sessions',
  },
  captureUserActions: {
    title: 'Replay User Actions',
    subtitle: 'See exactly what users did with step-by-step action replay',
  },
  captureNetworkActivity: {
    title: 'Monitor Network Activity',
    subtitle: 'Inspect API calls, request timing, and network errors',
  },
  captureServerLogs: {
    title: 'Collect Server Logs',
    subtitle: 'Correlate frontend issues with server-side logs',
  },
} as const;

export const RESOURCE_UPSELL_CONFIGS: Partial<Record<FeatureLimit, UpsellConfig>> = {
  links: {
    title: 'Link Limit Reached',
    subtitle: 'Upgrade your plan to create more recording links',
  },
  recordings: {
    title: 'Recording Limit Reached',
    subtitle: 'Upgrade your plan to capture more recordings',
  },
  seats: {
    title: 'Seat Limit Reached',
    subtitle: 'Upgrade your plan to invite more team members',
  },
} as const;

export const GENERIC_UPSELL_CONFIG: UpsellConfig = {
  title: 'Upgrade Your Plan',
  subtitle: 'Get more out of Userplane with an upgrade',
};

export function resolveUpsellConfig(feature: string | null): UpsellConfig {
  if (!feature) return GENERIC_UPSELL_CONFIG;
  return (
    UPSELL_CONFIGS[feature as FeatureGate] ??
    RESOURCE_UPSELL_CONFIGS[feature as FeatureLimit] ??
    GENERIC_UPSELL_CONFIG
  );
}
