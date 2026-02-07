/**
 * Intercom Canvas Kit Route Handlers
 *
 * Split handlers for Messenger (customer-facing) and Inbox (teammate) contexts.
 * Each endpoint explicitly handles a single context for clarity and type-safety.
 *
 * Features:
 * - Zod validation at request boundaries
 * - Structured logging with request context
 * - Sentry error tracking with Intercom-specific tags
 *
 * @see https://developers.intercom.com/docs/canvas-kit
 */

import * as Sentry from '@sentry/node';
import { buildWebhookTags } from '@workspace/sentry';
import type { Context } from 'hono';

import { buildCanvasErrorCanvas } from '@/api/lib/intercom-canvas';
import { createLogger } from '@/api/lib/logger';
import { getParsedBody } from '@/api/middleware/intercom-signature';
import type { IntercomCanvasService } from '@/api/services/intercom-canvas.service';
import {
  IntercomCanvasConfigureRequestSchema,
  IntercomCanvasInitializeRequestSchema,
  IntercomCanvasSubmitRequestSchema,
} from '@/api/types/intercom-canvas';

const logger = createLogger('intercom-canvas');

/**
 * Intercom context for Sentry tracking
 */
interface IntercomSentryContext {
  intercom_workspace_id?: string;
  teammate_email?: string;
  component_id?: string;
  endpoint: string;
  [key: string]: unknown;
}

/**
 * Set Sentry context for Intercom requests
 */
function setIntercomSentryContext(ctx: IntercomSentryContext): void {
  Sentry.setContext('intercom', ctx);
  Sentry.setTags(
    buildWebhookTags({
      webhookType: 'intercom_canvas',
      eventType: ctx.endpoint,
    })
  );
}

/**
 * Handle errors with Sentry capture and logging
 */
function handleError(
  error: unknown,
  endpoint: string,
  context: Record<string, unknown> = {}
): void {
  logger.error({ err: error, endpoint, ...context }, `Canvas ${endpoint} error`);

  Sentry.captureException(error, {
    tags: buildWebhookTags({
      webhookType: 'intercom_canvas',
      eventType: endpoint,
    }),
    contexts: {
      intercom: context,
    },
  });
}

// =============================================================================
// Messenger Handlers (Customer-facing)
// =============================================================================

/**
 * Handler for POST /canvas/messenger/initialize
 *
 * Called when a customer opens a card in Messenger.
 */
export function createMessengerInitializeHandler(service: IntercomCanvasService) {
  return async (c: Context) => {
    const endpoint = 'messenger/initialize';

    try {
      const rawBody = getParsedBody(c);
      const parseResult = IntercomCanvasInitializeRequestSchema.safeParse(rawBody);

      if (!parseResult.success) {
        logger.warn(
          { errors: parseResult.error.flatten(), endpoint },
          'Invalid messenger initialize request'
        );
        return c.json({ canvas: buildCanvasErrorCanvas() }, 200);
      }

      const body = parseResult.data;

      setIntercomSentryContext({
        intercom_workspace_id: body.workspace_id,
        endpoint,
      });

      logger.info(
        { workspaceId: body.workspace_id, hasLinkUrl: !!body.card_creation_options?.link_url },
        'Messenger initialize request'
      );

      const response = service.handleMessengerInitialize(body);
      return c.json(response);
    } catch (error) {
      handleError(error, endpoint);
      return c.json({ canvas: buildCanvasErrorCanvas() }, 200);
    }
  };
}

/**
 * Handler for POST /canvas/messenger/submit
 *
 * Called when a customer interacts with a card in Messenger.
 */
export function createMessengerSubmitHandler(service: IntercomCanvasService) {
  return async (c: Context) => {
    const endpoint = 'messenger/submit';

    try {
      const rawBody = getParsedBody(c);
      const parseResult = IntercomCanvasSubmitRequestSchema.safeParse(rawBody);

      if (!parseResult.success) {
        logger.warn(
          { errors: parseResult.error.flatten(), endpoint },
          'Invalid messenger submit request'
        );
        return c.json({ canvas: buildCanvasErrorCanvas() }, 200);
      }

      const body = parseResult.data;

      setIntercomSentryContext({
        intercom_workspace_id: body.workspace_id,
        component_id: body.component_id,
        endpoint,
      });

      logger.info(
        { workspaceId: body.workspace_id, componentId: body.component_id },
        'Messenger submit request'
      );

      const response = service.handleMessengerSubmit(body);
      return c.json(response);
    } catch (error) {
      handleError(error, endpoint);
      return c.json({ canvas: buildCanvasErrorCanvas() }, 200);
    }
  };
}

/**
 * Handler for POST /canvas/messenger/configure
 *
 * Used for Messenger card configuration flow.
 */
export function createMessengerConfigureHandler(service: IntercomCanvasService) {
  return async (c: Context) => {
    const endpoint = 'messenger/configure';

    try {
      const rawBody = getParsedBody(c);
      const parseResult = IntercomCanvasConfigureRequestSchema.safeParse(rawBody);

      if (!parseResult.success) {
        logger.warn(
          { errors: parseResult.error.flatten(), endpoint },
          'Invalid messenger configure request'
        );
        return c.json({ canvas: buildCanvasErrorCanvas() }, 200);
      }

      const body = parseResult.data;

      setIntercomSentryContext({
        intercom_workspace_id: body.workspace_id,
        teammate_email: body.admin.email,
        component_id: body.component_id,
        endpoint,
      });

      logger.info(
        {
          workspaceId: body.workspace_id,
          teammateEmail: body.admin.email,
          componentId: body.component_id,
          isInitial: !body.component_id,
        },
        'Messenger configure request'
      );

      const response = await service.handleConfigure(body);
      return c.json(response);
    } catch (error) {
      handleError(error, endpoint);
      return c.json({ canvas: buildCanvasErrorCanvas() }, 200);
    }
  };
}

// =============================================================================
// Inbox Handlers (Teammate-facing)
// =============================================================================

/**
 * Handler for POST /canvas/inbox/initialize
 *
 * Called when a teammate opens the app in the Inbox conversation details.
 */
export function createInboxInitializeHandler(service: IntercomCanvasService) {
  return async (c: Context) => {
    const endpoint = 'inbox/initialize';

    try {
      const rawBody = getParsedBody(c);
      const parseResult = IntercomCanvasInitializeRequestSchema.safeParse(rawBody);

      if (!parseResult.success) {
        logger.warn(
          { errors: parseResult.error.flatten(), endpoint },
          'Invalid inbox initialize request'
        );
        return c.json({ canvas: buildCanvasErrorCanvas() }, 200);
      }

      const body = parseResult.data;

      setIntercomSentryContext({
        intercom_workspace_id: body.workspace_id,
        teammate_email: body.admin?.email,
        endpoint,
      });

      logger.info(
        {
          workspaceId: body.workspace_id,
          teammateEmail: body.admin?.email,
          hasTeammate: !!body.admin,
        },
        'Inbox initialize request'
      );

      const response = await service.handleInboxInitialize(body);
      return c.json(response);
    } catch (error) {
      handleError(error, endpoint);
      return c.json({ canvas: buildCanvasErrorCanvas() }, 200);
    }
  };
}

/**
 * Handler for POST /canvas/inbox/submit
 *
 * Called when a teammate interacts with the inbox app.
 */
export function createInboxSubmitHandler(service: IntercomCanvasService) {
  return async (c: Context) => {
    const endpoint = 'inbox/submit';

    try {
      const rawBody = getParsedBody(c);
      const parseResult = IntercomCanvasSubmitRequestSchema.safeParse(rawBody);

      if (!parseResult.success) {
        logger.warn(
          { errors: parseResult.error.flatten(), endpoint },
          'Invalid inbox submit request'
        );
        return c.json({ canvas: buildCanvasErrorCanvas() }, 200);
      }

      const body = parseResult.data;

      setIntercomSentryContext({
        intercom_workspace_id: body.workspace_id,
        teammate_email: body.admin?.email,
        component_id: body.component_id,
        endpoint,
      });

      logger.info(
        {
          workspaceId: body.workspace_id,
          teammateEmail: body.admin?.email,
          componentId: body.component_id,
        },
        'Inbox submit request'
      );

      const response = await service.handleInboxSubmit(body);
      return c.json(response);
    } catch (error) {
      handleError(error, endpoint);
      return c.json({ canvas: buildCanvasErrorCanvas() }, 200);
    }
  };
}
