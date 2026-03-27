import { Hono } from 'hono';

import { createLogger } from '@/api/lib/logger';
import { getRawBody, type SlackSignatureEnv } from '@/api/middleware/slack-signature';
import { captureException } from '@/api/posthog';
import {
  type SlackCanvasService,
  SlackEventEnvelopeSchema,
} from '@/api/services/slack-canvas.service';

const logger = createLogger('slack-events');

export function createSlackEventsRouter(service: SlackCanvasService): Hono<SlackSignatureEnv> {
  const router = new Hono<SlackSignatureEnv>();

  router.post('/', async (c) => {
    // Parse and validate the event envelope
    let rawJson: unknown;
    try {
      rawJson = JSON.parse(getRawBody(c));
    } catch {
      logger.warn('Failed to parse Slack event body as JSON');
      return c.json({ ok: false }, 400);
    }

    const parseResult = SlackEventEnvelopeSchema.safeParse(rawJson);
    if (!parseResult.success) {
      // Return 200 to prevent retries, but log at warn level for visibility.
      // This fires when Slack sends event types we don't handle yet.
      logger.warn({ errors: parseResult.error.flatten() }, 'Unrecognized Slack event envelope');
      return c.json({ ok: true });
    }

    const body = parseResult.data;

    // URL verification challenge (during app setup)
    if (body.type === 'url_verification') {
      return c.json({ challenge: body.challenge });
    }

    // Skip retries for timeout (first attempt likely succeeded).
    // Process retries for actual errors (http_error, connection_failed, etc.)
    // so lifecycle events like app_uninstalled are not lost.
    const retryNum = c.req.header('x-slack-retry-num');
    const retryReason = c.req.header('x-slack-retry-reason');
    if (retryNum && retryReason === 'http_timeout') {
      logger.debug({ retryNum, retryReason }, 'Skipping retried event (timeout)');
      return c.json({ ok: true });
    }

    // Handle event callbacks — acknowledge immediately, process async
    const { team_id: teamId, event } = body;

    switch (event.type) {
      case 'app_home_opened':
        if (event.tab === 'home' && event.user) {
          void service.handleAppHomeOpened(teamId, event.user).catch((error) => {
            logger.error({ error, teamId }, 'handleAppHomeOpened failed');
            captureException(error, undefined, { operation: 'slack_app_home_opened', teamId });
          });
        }
        break;
      case 'app_uninstalled':
        void service.handleAppUninstalled(teamId).catch((error) => {
          logger.error({ error, teamId }, 'handleAppUninstalled failed');
          captureException(error, undefined, { operation: 'slack_app_uninstalled', teamId });
        });
        break;
      case 'tokens_revoked':
        if (event.tokens) {
          void service.handleTokensRevoked(teamId, event.tokens).catch((error) => {
            logger.error({ error, teamId }, 'handleTokensRevoked failed');
            captureException(error, undefined, { operation: 'slack_tokens_revoked', teamId });
          });
        }
        break;
      default:
        logger.debug({ eventType: event.type }, 'Unhandled event type');
    }

    return c.json({ ok: true });
  });

  return router;
}
