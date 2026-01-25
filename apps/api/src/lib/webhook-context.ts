/**
 * Webhook Context using AsyncLocalStorage
 *
 * Stores webhook headers (webhook-id, webhook-timestamp) so they can be
 * accessed in the onPayload callback of the Better Auth adapter.
 *
 * The Better Auth Dodo adapter verifies signatures using headers but doesn't
 * expose them to the onPayload callback. This module bridges that gap.
 */

import { AsyncLocalStorage } from 'node:async_hooks';

export interface WebhookContext {
  webhookId: string;
  webhookTimestamp: string;
}

const webhookContextStorage = new AsyncLocalStorage<WebhookContext>();

/**
 * Run a function with webhook context available
 */
export function runWithWebhookContext<T>(context: WebhookContext, fn: () => T): T {
  return webhookContextStorage.run(context, fn);
}

/**
 * Get the current webhook context (returns undefined if not in webhook context)
 */
export function getWebhookContext(): WebhookContext | undefined {
  return webhookContextStorage.getStore();
}
