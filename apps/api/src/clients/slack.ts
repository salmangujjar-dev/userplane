/**
 * Slack API client
 * Handles OAuth V2 flow and API calls to Slack
 *
 * Important: Slack API always returns HTTP 200, even on errors.
 * Every response must check `data.ok === true` before using the result.
 */

import { env } from '@/api/env';
import { createLogger } from '@/api/lib/logger';
import { captureException } from '@/api/posthog';

const logger = createLogger('slack-client');

/**
 * Bot scopes requested during Slack OAuth V2 installation
 */
export const SLACK_BOT_SCOPES =
  'commands,chat:write,chat:write.public,im:write,users:read,users:read.email,team:read';

// =============================================================================
// Interfaces
// =============================================================================

/**
 * Slack OAuth V2 access token response (success case).
 * Returned by exchangeCodeForToken only when all required fields are present.
 */
export interface SlackOAuthV2Response {
  ok: true;
  access_token: string;
  token_type: string;
  scope: string;
  bot_user_id: string;
  app_id: string;
  team: { id: string; name: string };
  authed_user: { id: string };
  enterprise?: { id: string; name: string } | null;
  is_enterprise_install?: boolean;
}

/**
 * Slack auth.test response (success case).
 * Returned by authTest only when all required fields are present.
 */
export interface SlackAuthTestResponse {
  ok: true;
  url: string;
  team: string;
  user: string;
  team_id: string;
  user_id: string;
  bot_id?: string;
  enterprise_id?: string;
}

/**
 * Slack user object from users.info
 */
export interface SlackUser {
  id: string;
  name: string;
  real_name?: string;
  deleted: boolean;
  is_bot: boolean;
  profile: {
    email?: string;
    display_name?: string;
    real_name?: string;
    image_48?: string;
  };
}

// =============================================================================
// OAuth
// =============================================================================

/**
 * Build Slack OAuth V2 authorization URL
 * Redirects admin to Slack to authorize the app installation
 */
export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.slack.clientId,
    scope: SLACK_BOT_SCOPES,
    redirect_uri: env.slack.redirectUri,
    state,
  });

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for bot access token
 * Uses HTTP Basic Auth with client_id:client_secret
 */
export async function exchangeCodeForToken(code: string): Promise<SlackOAuthV2Response | null> {
  try {
    const credentials = Buffer.from(`${env.slack.clientId}:${env.slack.clientSecret}`).toString(
      'base64'
    );

    const body = new URLSearchParams({
      code,
      redirect_uri: env.slack.redirectUri,
      grant_type: 'authorization_code',
    });

    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn({ status: response.status, error: errorText }, 'Token exchange failed');
      captureException(new Error('token exchange failed with slack'), undefined, {
        operation: 'slack_token_exchange',
        status: response.status,
        error_text: errorText,
      });
      return null;
    }

    const data = (await response.json()) as {
      ok: boolean;
      error?: string;
    } & Partial<SlackOAuthV2Response>;

    if (
      !data.ok ||
      !data.access_token ||
      !data.bot_user_id ||
      !data.app_id ||
      !data.team ||
      !data.authed_user
    ) {
      logger.warn(
        { error: data.error },
        'Slack token exchange returned ok=false or missing fields'
      );
      captureException(new Error('slack token exchange returned ok=false'), undefined, {
        operation: 'slack_token_exchange',
        slack_error: data.error,
      });
      return null;
    }

    return data as SlackOAuthV2Response;
  } catch (error) {
    logger.error({ error }, 'Token exchange error');
    captureException(error, undefined, { operation: 'slack_token_exchange' });
    return null;
  }
}

// =============================================================================
// API Methods
// =============================================================================

/**
 * Test authentication and get bot/team info
 * POST to auth.test with the bot token
 */
export async function authTest(accessToken: string): Promise<SlackAuthTestResponse | null> {
  try {
    const response = await fetch('https://slack.com/api/auth.test', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn({ status: response.status, error: errorText }, 'auth.test failed');
      captureException(new Error('slack auth.test failed'), undefined, {
        operation: 'slack_auth_test',
        status: response.status,
        error_text: errorText,
      });
      return null;
    }

    const data = (await response.json()) as {
      ok: boolean;
      error?: string;
    } & Partial<SlackAuthTestResponse>;

    if (!data.ok || !data.team_id || !data.user_id) {
      logger.warn({ error: data.error }, 'Slack auth.test returned ok=false or missing fields');
      captureException(new Error('slack auth.test returned ok=false'), undefined, {
        operation: 'slack_auth_test',
        slack_error: data.error,
      });
      return null;
    }

    return data as SlackAuthTestResponse;
  } catch (error) {
    logger.error({ error }, 'auth.test error');
    captureException(error, undefined, { operation: 'slack_auth_test' });
    return null;
  }
}

/**
 * Get user info by user ID
 */
export async function getUserInfo(accessToken: string, userId: string): Promise<SlackUser | null> {
  try {
    const params = new URLSearchParams({ user: userId });
    const response = await fetch(`https://slack.com/api/users.info?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn({ status: response.status, error: errorText, userId }, 'users.info failed');
      captureException(new Error('slack users.info failed'), undefined, {
        operation: 'slack_get_user_info',
        status: response.status,
        error_text: errorText,
        user_id: userId,
      });
      return null;
    }

    const data = (await response.json()) as { ok: boolean; user?: SlackUser; error?: string };

    if (!data.ok) {
      logger.warn({ error: data.error, userId }, 'Slack users.info returned ok=false');
      captureException(new Error('slack users.info returned ok=false'), undefined, {
        operation: 'slack_get_user_info',
        slack_error: data.error,
        user_id: userId,
      });
      return null;
    }

    return data.user ?? null;
  } catch (error) {
    logger.error({ error, userId }, 'users.info error');
    captureException(error, undefined, { operation: 'slack_get_user_info', user_id: userId });
    return null;
  }
}

/**
 * Publish or update a user's App Home tab view
 */
export async function publishView(
  accessToken: string,
  userId: string,
  view: Record<string, unknown>
): Promise<boolean> {
  try {
    const response = await fetch('https://slack.com/api/views.publish', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        view,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn({ status: response.status, error: errorText, userId }, 'views.publish failed');
      captureException(new Error('slack views.publish failed'), undefined, {
        operation: 'slack_publish_view',
        status: response.status,
        error_text: errorText,
        user_id: userId,
      });
      return false;
    }

    const data = (await response.json()) as { ok: boolean; error?: string };

    if (!data.ok) {
      logger.warn({ error: data.error, userId }, 'Slack views.publish returned ok=false');
      captureException(new Error('slack views.publish returned ok=false'), undefined, {
        operation: 'slack_publish_view',
        slack_error: data.error,
        user_id: userId,
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error({ error, userId }, 'views.publish error');
    captureException(error, undefined, { operation: 'slack_publish_view', user_id: userId });
    return false;
  }
}

/**
 * Open a modal view in Slack
 */
export async function openModal(
  accessToken: string,
  triggerId: string,
  view: Record<string, unknown>
): Promise<boolean> {
  try {
    const response = await fetch('https://slack.com/api/views.open', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trigger_id: triggerId,
        view,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn({ status: response.status, error: errorText, triggerId }, 'views.open failed');
      captureException(new Error('slack views.open failed'), undefined, {
        operation: 'slack_open_modal',
        status: response.status,
        error_text: errorText,
        trigger_id: triggerId,
      });
      return false;
    }

    const data = (await response.json()) as { ok: boolean; error?: string };

    if (!data.ok) {
      logger.warn({ error: data.error, triggerId }, 'Slack views.open returned ok=false');
      captureException(new Error('slack views.open returned ok=false'), undefined, {
        operation: 'slack_open_modal',
        slack_error: data.error,
        trigger_id: triggerId,
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error({ error, triggerId }, 'views.open error');
    captureException(error, undefined, { operation: 'slack_open_modal', trigger_id: triggerId });
    return false;
  }
}

/**
 * Post a message to a Slack channel
 * Returns the message timestamp (ts) on success, null on failure
 */
export async function postMessage(
  accessToken: string,
  channel: string,
  blocks: unknown[],
  text: string
): Promise<string | null> {
  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel,
        blocks,
        text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn(
        { status: response.status, error: errorText, channel },
        'chat.postMessage failed'
      );
      captureException(new Error('slack chat.postMessage failed'), undefined, {
        operation: 'slack_post_message',
        status: response.status,
        error_text: errorText,
        channel,
      });
      return null;
    }

    const data = (await response.json()) as { ok: boolean; ts?: string; error?: string };

    if (!data.ok) {
      logger.warn({ error: data.error, channel }, 'Slack chat.postMessage returned ok=false');
      captureException(new Error('slack chat.postMessage returned ok=false'), undefined, {
        operation: 'slack_post_message',
        slack_error: data.error,
        channel,
      });
      return null;
    }

    return data.ts ?? null;
  } catch (error) {
    logger.error({ error, channel }, 'chat.postMessage error');
    captureException(error, undefined, { operation: 'slack_post_message', channel });
    return null;
  }
}
