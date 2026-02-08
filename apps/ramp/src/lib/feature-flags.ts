// Feature flags for deliberately gating or breaking surfaces.
// Set a flag to `false` to simulate a failure on that surface.
// Works on both client and server (plain object, no React dependency).

const featureFlags = {
  // Client-side: controls whether the "New Expense" button opens the dialog
  newExpenseButton: true,

  // Server-side: controls whether the POST /api/expenses endpoint accepts creates
  createExpenseSubmit: true,

  // Client-side: controls whether the spending trend period tabs are switchable
  spendingTrendTabs: true,
} as const satisfies Record<string, boolean>;

export type FeatureFlag = keyof typeof featureFlags;

// Check if a feature is enabled
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag];
}

// Convert feature flags to a flat metadata object for the Userplane SDK.
// Keys are prefixed with `flag_` to namespace them (matches YC app convention).
export function getFeatureFlagsMetadata(): Record<string, boolean> {
  const metadata: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(featureFlags)) {
    metadata[`flag_${key}`] = value;
  }
  return metadata;
}
