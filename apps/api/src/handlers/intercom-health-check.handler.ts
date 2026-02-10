/**
 * Intercom Installation Health Check Route Handler
 *
 * Responds to Intercom's daily health check probes with integration status.
 * Always returns HTTP 200 per Intercom spec; the `state` field conveys health.
 *
 * @see https://developers.intercom.com/docs/build-an-integration/learn-more/installation-health-check
 */

import * as Sentry from '@sentry/node';
import { buildWebhookTags } from '@workspace/sentry';
import type { Context } from 'hono';

import { createLogger } from '@/api/lib/logger';
import { getParsedBody } from '@/api/middleware/intercom-signature';
import type { IntercomHealthCheckService } from '@/api/services/intercom-health-check.service';
import type { IntercomHealthCheckResponse } from '@/api/types/intercom-health-check';
import { IntercomHealthCheckRequestSchema } from '@/api/types/intercom-health-check';

const logger = createLogger('intercom-health-check');

const UNKNOWN_RESPONSE: IntercomHealthCheckResponse = {
  state: 'UNKNOWN',
  message: 'Unable to determine installation health. Please try again later.',
};

export function createHealthCheckHandler(service: IntercomHealthCheckService) {
  return async (c: Context) => {
    const endpoint = 'health-check';

    try {
      const rawBody = getParsedBody(c);
      const parseResult = IntercomHealthCheckRequestSchema.safeParse(rawBody);

      if (!parseResult.success) {
        logger.warn(
          { errors: parseResult.error.flatten(), endpoint },
          'Invalid health check request'
        );
        return c.json(UNKNOWN_RESPONSE, 200);
      }

      const body = parseResult.data;

      Sentry.setContext('intercom', {
        intercom_workspace_id: body.workspace_id,
        endpoint,
      });
      Sentry.setTags(
        buildWebhookTags({
          webhookType: 'intercom_health_check',
          eventType: endpoint,
        })
      );

      logger.info({ workspaceId: body.workspace_id }, 'Health check request');

      const response = await service.checkHealth(body.workspace_id);
      return c.json(response, 200);
    } catch (error) {
      logger.error({ err: error, endpoint }, 'Health check error');

      Sentry.captureException(error, {
        tags: buildWebhookTags({
          webhookType: 'intercom_health_check',
          eventType: endpoint,
        }),
      });

      return c.json(UNKNOWN_RESPONSE, 200);
    }
  };
}
