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

    try {
      switch (payload.type) {
        case 'block_actions':
          await service.handleBlockAction(payload);
          return c.json({ ok: true });
        case 'view_submission': {
          const result = await service.handleViewSubmission(payload);
          return result ? c.json(result) : c.body(null, 200);
        }
        case 'view_closed':
          return c.json({ ok: true });
      }
    } catch (error) {
      logger.error({ err: error, type: payload.type }, 'Slack interactive handler failed');
      captureException(error, undefined, {
        operation: 'slack_interactive',
        type: payload.type,
      });
      return c.json({ ok: true });
    }
  });

  return router;
}
