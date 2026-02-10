/**
 * Intercom Installation Health Check Types
 *
 * Zod schemas for the health check endpoint that Intercom calls
 * at least once daily per installed workspace.
 *
 * @see https://developers.intercom.com/docs/build-an-integration/learn-more/installation-health-check
 */

import { z } from 'zod';

/**
 * Request body sent by Intercom to the health check endpoint
 */
export const IntercomHealthCheckRequestSchema = z.object({
  workspace_id: z.string(),
});

export type IntercomHealthCheckRequest = z.infer<typeof IntercomHealthCheckRequestSchema>;

/**
 * Health check states
 */
export type IntercomHealthState = 'HEALTHY' | 'UNHEALTHY' | 'UNKNOWN';

/**
 * Response returned to Intercom from the health check endpoint
 */
export interface IntercomHealthCheckResponse {
  state: IntercomHealthState;
  message?: string;
  cta_type?: 'url';
  cta_url?: string;
  cta_label?: string;
}
