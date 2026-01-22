/**
 * DodoPayments client initialization
 *
 * Provides a configured DodoPayments SDK client for server-side operations.
 */

import DodoPayments from 'dodopayments';

import type { DodoPaymentsConfig } from './types';

let dodoPaymentsInstance: DodoPayments | null = null;

/**
 * Create a new DodoPayments client instance
 */
export function createDodoPaymentsClient(config: DodoPaymentsConfig): DodoPayments {
  return new DodoPayments({
    bearerToken: config.apiKey,
    environment: config.environment,
  });
}

/**
 * Get or create a singleton DodoPayments client
 */
export function getDodoPaymentsClient(config: DodoPaymentsConfig): DodoPayments {
  if (!dodoPaymentsInstance) {
    dodoPaymentsInstance = createDodoPaymentsClient(config);
  }
  return dodoPaymentsInstance;
}

/**
 * Reset the singleton client (useful for testing)
 */
export function resetDodoPaymentsClient(): void {
  dodoPaymentsInstance = null;
}

export { DodoPayments };
