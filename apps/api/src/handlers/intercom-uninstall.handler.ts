/**
 * Intercom Uninstall Webhook Handler
 *
 * Handles the POST notification Intercom sends when a user uninstalls
 * the app or revokes access. Performs cleanup by soft-deleting the
 * integration record and invalidating caches.
 *
 * @see https://developers.intercom.com/docs/build-an-integration/learn-more/authentication/installing-uninstalling-apps#uninstallation
 */

import type { CacheService } from '@workspace/cache';
import type { Context } from 'hono';
import { z } from 'zod';

import { createLogger } from '@/api/lib/logger';
import { getParsedBody } from '@/api/middleware/intercom-signature';
import { captureException } from '@/api/posthog';
import type { IntegrationRepository } from '@/api/repositories/integrations.repository';

const logger = createLogger('intercom-uninstall');

const IntercomUninstallRequestSchema = z.object({
  app_id: z.string(),
});

export interface IntercomUninstallHandlerDeps {
  integrationRepo: IntegrationRepository;
  cacheService: CacheService;
}

export function createUninstallHandler(deps: IntercomUninstallHandlerDeps) {
  return async (c: Context) => {
    const endpoint = 'uninstall';

    try {
      const rawBody = getParsedBody(c);
      const parseResult = IntercomUninstallRequestSchema.safeParse(rawBody);

      if (!parseResult.success) {
        logger.warn({ errors: parseResult.error.flatten(), endpoint }, 'Invalid uninstall request');
        captureException(new Error('received invalid uninstall request'), undefined, {
          operation: 'intercom_uninstall',
          errors: parseResult.error.flatten(),
          endpoint,
        });
        return c.json({}, 200);
      }

      const { app_id } = parseResult.data;

      logger.debug({ appId: app_id }, 'Uninstall webhook received');

      // Look up the integration by Intercom app_id (stored as providerWorkspaceId)
      const integration = await deps.integrationRepo.findByProviderWorkspaceId('intercom', app_id);

      if (!integration) {
        logger.warn({ appId: app_id }, 'No active integration found for uninstall, ignoring');
        // No need to capture exception for this case since it is possible
        // that the integration is removed prior to the uninstall webhook being received
        return c.json({}, 200);
      }

      // Soft-delete the integration
      const deleted = await deps.integrationRepo.delete(integration.workspaceId, 'intercom');

      if (!deleted) {
        logger.warn(
          { appId: app_id, workspaceId: integration.workspaceId },
          'Integration already deleted during uninstall'
        );
        return c.json({}, 200);
      }

      // Invalidate caches
      await deps.cacheService.invalidateIntercom(integration.workspaceId, app_id);

      logger.debug(
        { appId: app_id, workspaceId: integration.workspaceId },
        'Integration disconnected via uninstall webhook'
      );

      return c.json({}, 200);
    } catch (error) {
      logger.error({ err: error, endpoint }, 'Uninstall webhook error');

      captureException(error, undefined, {
        webhook_type: 'intercom_uninstall',
        event_type: endpoint,
      });

      // Always return 200 to acknowledge receipt
      return c.json({}, 200);
    }
  };
}
