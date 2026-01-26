/**
 * Feature flag utilities for auth hooks
 * Provides composable utilities for conditional hook execution
 * Supports both config-based and environment variable-based flags
 */

/**
 * Internal storage for feature flags config passed via AuthConfig
 * Config overrides take precedence over environment variables
 */
let featureFlagsConfig: {
  enableEmailNormalization?: boolean;
  allowDisposableEmail?: boolean;
  enableNameNormalization?: boolean;
} = {};

/**
 * Set feature flags configuration from AuthConfig
 * Called internally by createAuth to register config overrides
 */
export function setFeatureFlagsConfig(config: typeof featureFlagsConfig): void {
  featureFlagsConfig = { ...config };
}

/**
 * Check if a feature flag is enabled
 * Checks config override first, then falls back to environment variable
 * @param flagName - The environment variable name
 * @param configValue - The config override value (if any)
 * @returns true if the flag is enabled via config or environment variable
 */
function isFeatureEnabled(flagName: string, configValue?: boolean): boolean {
  if (configValue !== undefined) {
    return configValue;
  }
  return process.env[flagName] === 'true';
}

/**
 * Check if disposable email blocking is enabled
 * Feature flag: ENABLE_DISPOSABLE_EMAIL_CHECK or featureFlags.allowDisposableEmail
 * Note: allowDisposableEmail=true means disposable emails are allowed (check is disabled)
 */
export function isDisposableEmailCheckEnabled(): boolean {
  if (featureFlagsConfig.allowDisposableEmail !== undefined) {
    return !featureFlagsConfig.allowDisposableEmail;
  }
  return isFeatureEnabled('ENABLE_DISPOSABLE_EMAIL_CHECK', undefined);
}

/**
 * Check if email normalization is enabled
 * Feature flag: ENABLE_EMAIL_NORMALIZATION or featureFlags.enableEmailNormalization
 */
export function isEmailNormalizationEnabled(): boolean {
  return isFeatureEnabled(
    'ENABLE_EMAIL_NORMALIZATION',
    featureFlagsConfig.enableEmailNormalization
  );
}

/**
 * Check if name normalization is enabled
 * Feature flag: ENABLE_NAME_NORMALIZATION or featureFlags.enableNameNormalization
 */
export function isNameNormalizationEnabled(): boolean {
  return isFeatureEnabled('ENABLE_NAME_NORMALIZATION', featureFlagsConfig.enableNameNormalization);
}

/**
 * Generic guard that returns early if feature is disabled
 * @param flagName - The feature flag to check
 * @returns true if should return early (feature disabled)
 */
export function shouldSkipIfDisabled(flagName: string): boolean {
  return !isFeatureEnabled(flagName, undefined);
}

/**
 * Compose multiple feature flag checks with AND logic
 * @param flagNames - Array of feature flag names
 * @returns true if ALL flags are enabled
 */
export function areAllFeaturesEnabled(...flagNames: string[]): boolean {
  return flagNames.every((flag) => isFeatureEnabled(flag, undefined));
}

/**
 * Compose multiple feature flag checks with OR logic
 * @param flagNames - Array of feature flag names
 * @returns true if ANY flag is enabled
 */
export function isAnyFeatureEnabled(...flagNames: string[]): boolean {
  return flagNames.some((flag) => isFeatureEnabled(flag, undefined));
}
