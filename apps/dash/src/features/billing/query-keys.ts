/**
 * Query key factory for billing-related queries
 *
 * Structure:
 * - all: Base key for all billing queries
 * - subscription(workspaceId): Subscription status for a workspace
 * - usage(workspaceId): Usage summary for a workspace
 * - addons(workspaceId): Add-ons status for a workspace
 *
 * Why this structure:
 * - Groups all billing queries under common 'billing' namespace
 * - Enables invalidating all billing data with single key
 * - Simple flat structure since billing has few query types
 */
export const billingKeys = {
  all: ['billing'] as const,

  subscription: (workspaceId: string) => [...billingKeys.all, 'subscription', workspaceId] as const,
  usage: (workspaceId: string) => [...billingKeys.all, 'usage', workspaceId] as const,
  addons: (workspaceId: string) => [...billingKeys.all, 'addons', workspaceId] as const,
} as const;

// Type helpers for query key inference
export type BillingKeys = typeof billingKeys;
