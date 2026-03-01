/**
 * Shared enum constants for schema CHECK constraints
 *
 * NOTE: billingCadence is used in both entitlements and subscriptions tables.
 * The CHECK constraint is applied directly in each table definition.
 * The constant array is re-exported here for shared access.
 */

export { BILLING_CADENCES } from '@userplane/pricing';
