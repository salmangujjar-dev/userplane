import { Hono } from 'hono';

import { createLogger } from '@/api/lib/logger';
import { getRawBody, type SlackSignatureEnv } from '@/api/middleware/slack-signature';
import { captureException } from '@/api/posthog';
import {
  type SlackCanvasService,
  SlackInteractivePayloadSchema,
} from '@/api/services/slack-canvas.service';

const logger = createLogger('slack-interactive');

export function createSlackInteractiveRouter(service: SlackCanvasService): Hono<SlackSignatureEnv> {
  const router = new Hono<SlackSignatureEnv>();

  router.post('/', async (c) => {
    const rawBody = getRawBody(c);
    // Interactive payloads come as URL-encoded form with 'payload' JSON field
    const params = new URLSearchParams(rawBody);
    const payloadStr = params.get('payload');
    if (!payloadStr) {
      logger.warn('Missing payload field in interactive request');
      return c.json({ ok: false }, 400);
    }

    let rawJson: unknown;
    try {
      rawJson = JSON.parse(payloadStr);
    } catch {
      logger.warn('Failed to parse interactive payload JSON');
      return c.json({ ok: false }, 400);
    }

    const parseResult = SlackInteractivePayloadSchema.safeParse(rawJson);
    if (!parseResult.success) {
      logger.warn({ errors: parseResult.error.flatten() }, 'Invalid interactive payload');
      captureException(new Error('invalid slack interactive payload'), undefined, {
        operation: 'slack_interactive_parse',
        errors: parseResult.error.flatten(),
      });
      return c.json({ ok: true });
    }

    const payload = parseResult.data;

    switch (payload.type) {
      case 'message_action':
        // Fire-and-forget — acknowledge immediately to avoid Slack's timeout.
        void service.handleMessageShortcut(payload).catch((error) => {
          logger.error({ error, type: payload.type }, 'handleMessageShortcut failed');
          captureException(error, undefined, {
            operation: 'slack_message_shortcut',
            type: payload.type,
          });
        });
        return c.json({ ok: true });
      case 'block_actions':
        // Fire-and-forget — acknowledge immediately to avoid Slack's timeout.
        // Errors are delivered via DM since block actions have no response_url.
        void service.handleBlockAction(payload).catch((error) => {
          logger.error({ error, type: payload.type }, 'handleBlockAction failed');
          captureException(error, undefined, {
            operation: 'slack_block_action',
            type: payload.type,
          });
        });
        return c.json({ ok: true });
      case 'view_submission': {
        // Validation runs synchronously (no I/O). The heavy work (link
        // creation, channel message) is fire-and-forget inside the service
        // and updates the modal via views.update when done.
        const result = service.handleViewSubmission(payload);
        return result ? c.json(result) : c.body(null, 200);
      }
      case 'view_closed':
        return c.json({ ok: true });
    }
  });

  return router;
}
