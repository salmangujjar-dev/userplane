import { Hono } from 'hono';

import { createLogger } from '@/api/lib/logger';
import { getRawBody, type SlackSignatureEnv } from '@/api/middleware/slack-signature';
import type { SlackCanvasService } from '@/api/services/slack-canvas.service';

const logger = createLogger('slack-commands');

export function createSlackCommandsRouter(service: SlackCanvasService): Hono<SlackSignatureEnv> {
  const router = new Hono<SlackSignatureEnv>();

  router.post('/', async (c) => {
    const rawBody = getRawBody(c);
    const params = new URLSearchParams(rawBody);

    // Handle SSL check probes
    if (params.get('ssl_check') === '1') {
      return c.body(null, 200);
    }

    // Validate required fields
    const triggerId = params.get('trigger_id');
    const userId = params.get('user_id');
    const teamId = params.get('team_id');

    if (!triggerId || !userId || !teamId) {
      logger.warn('Slash command missing required fields (trigger_id, user_id, or team_id)');
      return c.json({ response_type: 'ephemeral', text: 'Invalid request' }, 200);
    }

    const payload = {
      command: params.get('command') ?? '',
      text: params.get('text') ?? '',
      triggerId,
      userId,
      teamId,
      channelId: params.get('channel_id') ?? '',
      channelName: params.get('channel_name') ?? '',
      responseUrl: params.get('response_url') ?? '',
      enterpriseId: params.get('enterprise_id') ?? undefined,
    };

    logger.debug({ command: payload.command, text: payload.text }, 'Slash command received');

    const response = await service.handleSlashCommand(payload);
    return response ? c.json(response) : c.body(null, 200);
  });

  return router;
}
