/**
 * Feature flag utilities for auth hooks
 * Provides composable utilities for conditional hook execution
 */

/**
 * Check if a feature flag is enabled via environment variable
 * @param flagName - The environment variable name
 * @returns true if the flag is explicitly set to 'true'
 */
export function isFeatureEnabled(flagName: string): boolean {
  return process.env[flagName] === 'true';
}

/**
 * Check if disposable email blocking is enabled
 * Feature flag: ENABLE_DISPOSABLE_EMAIL_CHECK
 */
export function isDisposableEmailCheckEnabled(): boolean {
  return isFeatureEnabled('ENABLE_DISPOSABLE_EMAIL_CHECK');
}

/**
 * Check if email normalization is enabled
 * Feature flag: ENABLE_EMAIL_NORMALIZATION
 */
export function isEmailNormalizationEnabled(): boolean {
  return isFeatureEnabled('ENABLE_EMAIL_NORMALIZATION');
}

/**
 * Generic guard that returns early if feature is disabled
 * @param flagName - The feature flag to check
 * @returns true if should return early (feature disabled)
 */
export function shouldSkipIfDisabled(flagName: string): boolean {
  return !isFeatureEnabled(flagName);
}

/**
 * Compose multiple feature flag checks with AND logic
 * @param flagNames - Array of feature flag names
 * @returns true if ALL flags are enabled
 */
export function areAllFeaturesEnabled(...flagNames: string[]): boolean {
  return flagNames.every(isFeatureEnabled);
}

/**
 * Compose multiple feature flag checks with OR logic
 * @param flagNames - Array of feature flag names
 * @returns true if ANY flag is enabled
 */
export function isAnyFeatureEnabled(...flagNames: string[]): boolean {
  return flagNames.some(isFeatureEnabled);
}
