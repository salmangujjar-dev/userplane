/**
 * ZendeskNotificationService - Posts internal notes to Zendesk tickets
 * when recordings are received for links created via Zendesk
 */

import type { CacheService } from '@userplane/cache';
import type { ZendeskToken } from '@userplane/contract';
import { createProviderToken } from '@userplane/contract';

import { addTicketComment, refreshAccessToken } from '@/api/clients/zendesk';
import { createLogger } from '@/api/lib/logger';
import { captureException } from '@/api/posthog';
import {
  type IntegrationRepository,
  type TypedIntegration,
} from '@/api/repositories/integrations.repository';

const logger = createLogger('zendesk-notification-service');

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Buffer before expiry to trigger a refresh (5 minutes in ms) */
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

export class ZendeskNotificationService {
  constructor(
    private deps: {
      integrationRepo: IntegrationRepository;
      cacheService: CacheService;
    }
  ) {}

  /**
   * Get a valid access token, refreshing if expired.
   * Disconnects the integration on permanent refresh failures (expired/revoked token).
   * Falls back to the existing token on transient failures.
   */
  private async getValidAccessToken(
    integration: TypedIntegration<'zendesk'>
  ): Promise<string | null> {
    const token = integration.providerToken as ZendeskToken;
    const { accessToken, refreshToken, tokenExpiresAt } = token;

    // If no expiry info or token is still valid (with buffer), use current token
    if (
      !tokenExpiresAt ||
      new Date(tokenExpiresAt).getTime() - Date.now() > TOKEN_EXPIRY_BUFFER_MS
    ) {
      return accessToken;
    }

    // Token is expired or about to expire — try to refresh
    if (!refreshToken) {
      logger.warn(
        { integrationId: integration.id },
        'Zendesk token expired, no refresh token, disconnecting'
      );
      await this.disconnectIntegration(integration);
      return null;
    }

    // Check if refresh token is known-expired before making a network call
    if (token.refreshTokenExpiresAt) {
      const refreshExpiry = new Date(token.refreshTokenExpiresAt).getTime();
      if (refreshExpiry <= Date.now()) {
        logger.warn(
          { integrationId: integration.id },
          'Zendesk refresh token expired, disconnecting'
        );
        await this.disconnectIntegration(integration);
        return null;
      }
    }

    const subdomain = integration.providerMeta.subdomain;
    const result = await refreshAccessToken(subdomain, refreshToken);

    if (!result.ok) {
      if (result.permanent) {
        logger.warn(
          { integrationId: integration.id },
          'Zendesk refresh token invalid, disconnecting'
        );
        await this.disconnectIntegration(integration);
      } else {
        logger.warn(
          { integrationId: integration.id },
          'Zendesk token refresh failed (transient), using existing token'
        );
      }
      return accessToken;
    }

    // Build updated token and persist
    const updatedToken = createProviderToken('zendesk', {
      accessToken: result.data.access_token,
      apiToken: token.apiToken,
      refreshToken: result.data.refresh_token ?? refreshToken,
      tokenExpiresAt: result.data.expires_in
        ? new Date(Date.now() + result.data.expires_in * 1000).toISOString()
        : undefined,
      refreshTokenExpiresAt: result.data.refresh_token_expires_in
        ? new Date(Date.now() + result.data.refresh_token_expires_in * 1000).toISOString()
        : token.refreshTokenExpiresAt,
    });

    await this.deps.integrationRepo.updateProviderToken(integration.id, updatedToken);
    await this.deps.cacheService.invalidateIntegration('zendesk', integration.providerWorkspaceId);

    logger.debug({ integrationId: integration.id }, 'Zendesk token refreshed and persisted');
    return result.data.access_token;
  }

  /**
   * Disconnect a Zendesk integration by soft-deleting it and invalidating caches.
   */
  private async disconnectIntegration(integration: TypedIntegration<'zendesk'>): Promise<void> {
    try {
      await this.deps.integrationRepo.delete(integration.workspaceId, 'zendesk');
      await this.deps.cacheService.invalidateIntegration(
        'zendesk',
        integration.providerWorkspaceId
      );
    } catch (error) {
      logger.error(
        { err: error, integrationId: integration.id },
        'Failed to disconnect integration'
      );
    }
  }

  /**
   * Post an internal note to a Zendesk ticket when a recording is received
   * Fire-and-forget: logs errors but does not throw
   */
  async notifyRecordingReceived(params: {
    workspaceId: string;
    ticketId: string;
    recordingId: string;
    recordingUrl: string;
  }): Promise<void> {
    const { workspaceId, ticketId, recordingId, recordingUrl } = params;

    try {
      const integration = await this.deps.integrationRepo.findByWorkspaceIdAndProvider(
        workspaceId,
        'zendesk'
      );

      if (!integration) {
        logger.debug({ workspaceId }, 'No active Zendesk integration found, skipping notification');
        return;
      }

      const accessToken = await this.getValidAccessToken(integration);
      if (!accessToken) {
        logger.warn(
          { workspaceId, ticketId },
          'No valid Zendesk access token, skipping notification'
        );
        return;
      }
      const subdomain = integration.providerMeta.subdomain;

      const safeUrl = escapeHtmlAttr(recordingUrl);
      const body = [
        '<b>Recording received</b>',
        `<p>You've received a new recording.</p>`,
        `<p><a href="${safeUrl}">View recording &#8594;</a></p>`,
      ].join('');

      const success = await addTicketComment(subdomain, accessToken, ticketId, body, true);

      if (success) {
        logger.debug({ workspaceId, ticketId, recordingId }, 'Zendesk recording note posted');
      } else {
        logger.warn(
          { workspaceId, ticketId, recordingId },
          'Failed to post Zendesk recording note'
        );
        captureException(new Error('failed to post zendesk recording note'), undefined, {
          operation: 'zendesk_notify_recording',
          ticketId,
          workspaceId,
          recordingId,
        });
      }
    } catch (error) {
      logger.error(
        { err: error, workspaceId, ticketId, recordingId },
        'Error posting Zendesk recording note'
      );
      captureException(error, undefined, {
        component: 'zendesk_notification',
        operation: 'notify_recording_received',
        workspace_id: workspaceId,
        ticket_id: ticketId,
        recording_id: recordingId,
      });
    }
  }
}
