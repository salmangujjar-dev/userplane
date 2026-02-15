import type { FeatureGate } from '@workspace/pricing';

interface UpsellConfig {
  title: string;
  subtitle: string;
}

export const UPSELL_CONFIGS: Partial<Record<FeatureGate, UpsellConfig>> = {
  customizeWorkspace: {
    title: 'Customize Your Brand',
    subtitle: 'Add your logo, colors, and messaging to recording links',
  },
  requestConsoleLogs: {
    title: 'Capture Console Logs',
    subtitle: 'Debug faster with full console output from user sessions',
  },
  requestActionReplay: {
    title: 'Replay User Actions',
    subtitle: 'See exactly what users did with step-by-step action replay',
  },
  requestNetworkActivity: {
    title: 'Monitor Network Activity',
    subtitle: 'Inspect API calls, request timing, and network errors',
  },
  requestServerLogs: {
    title: 'Collect Server Logs',
    subtitle: 'Correlate frontend issues with server-side logs',
  },
} as const;

export type UpsellFeatureKey = keyof typeof UPSELL_CONFIGS;
