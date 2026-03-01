/**
 * DodoPayments client configuration for direct API access
 *
 * This client is used for operations that require direct DodoPayments SDK calls,
 * such as subscription plan changes (upgrades/downgrades).
 */

import { type DodoPayments, getDodoPaymentsClient } from '@userplane/payments/client';

import { env } from '@/api/env';

let dodoPaymentsInstance: DodoPayments | null = null;

/**
 * Get the singleton DodoPayments client instance
 */
export function getDodoClient(): DodoPayments {
  if (!dodoPaymentsInstance) {
    dodoPaymentsInstance = getDodoPaymentsClient({
      apiKey: env.payments.apiKey || '',
      webhookSecret: env.payments.webhookSecret || '',
      environment: env.payments.environment,
    });
  }
  return dodoPaymentsInstance;
}
