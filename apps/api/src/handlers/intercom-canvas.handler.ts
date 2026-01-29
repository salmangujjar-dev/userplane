/**
 * Intercom Canvas Kit Route Handlers
 * Handlers for Canvas Kit initialize, configure, and submit endpoints
 */

// import { createAppLogger } from '@workspace/logger';
import type { Context } from 'hono';

import { buildCanvasErrorCanvas } from '@/api/lib/intercom-canvas';
import { getParsedBody } from '@/api/middleware/intercom-signature';
import type { IntercomCanvasService } from '@/api/services/intercom-canvas.service';
import type {
  IntercomCanvasConfigureRequest,
  IntercomCanvasInitializeRequest,
  IntercomCanvasSubmitRequest,
} from '@/api/types/intercom-canvas';

/**
 * Create handler for POST /canvas/initialize
 * Called when a teammate opens the Inbox app or customer opens a card in Messenger
 */
export function createInitializeHandler(service: IntercomCanvasService) {
  return async (c: Context) => {
    try {
      const body = getParsedBody<IntercomCanvasInitializeRequest>(c);
      // logger.info({ payload: body }, 'Canvas initialize payload');
      const response = await service.handleInitialize(body);
      return c.json(response);
    } catch (error) {
      console.error('Canvas initialize error:', error);
      return c.json({ canvas: buildCanvasErrorCanvas() }, 200);
    }
  };
}

/**
 * Create handler for POST /canvas/configure
 * Called during card creation flow to configure card options
 * Can return either a canvas (for multi-step config) or results (to complete config)
 */
export function createConfigureHandler(service: IntercomCanvasService) {
  return async (c: Context) => {
    try {
      const body = getParsedBody<IntercomCanvasConfigureRequest>(c);
      // logger.info({ payload: body }, 'Canvas configure payload');
      const response = await service.handleConfigure(body);
      return c.json(response);
    } catch (error) {
      console.error('Canvas configure error:', error);
      // Return error canvas so teammate sees the error
      return c.json({ canvas: buildCanvasErrorCanvas() }, 200);
    }
  };
}

/**
 * Create handler for POST /canvas/submit
 * Called when user interacts with a canvas component (button click, form submit)
 */
export function createSubmitHandler(service: IntercomCanvasService) {
  return async (c: Context) => {
    try {
      const body = getParsedBody<IntercomCanvasSubmitRequest>(c);
      // logger.info({ payload: body }, 'Canvas submit payload');
      const response = await service.handleSubmit(body);
      return c.json(response);
    } catch (error) {
      console.error('Canvas submit error:', error);
      return c.json({ canvas: buildCanvasErrorCanvas() }, 200);
    }
  };
}
