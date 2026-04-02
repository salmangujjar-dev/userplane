/**
 * Slack API client
 * Handles OAuth V2 flow and API calls to Slack
 *
 * Important: Slack API always returns HTTP 200, even on errors.
 * Every response must check `data.ok === true` before using the result.
 * This is enforced via `z.literal(true)` on the `ok` field in each schema.
 */

import { z } from 'zod';

import { env } from '@/api/env';
import { createLogger } from '@/api/lib/logger';
import { captureException } from '@/api/posthog';

const logger = createLogger('slack-client');

/**
 * Bot scopes requested during Slack OAuth V2 installation
 */
export const SLACK_BOT_SCOPES =
  'commands,chat:write,chat:write.public,im:write,users:read,users:read.email,team:read';

/**
 * Maximum number of members to fetch from Slack's users.list API.
 * Kept low intentionally — the invite UI supports manual email entry
 * for anyone not in the initial batch, and we don't cache this data.
 */
export const SLACK_MEMBER_FETCH_LIMIT = 50;

// =============================================================================
// Schemas
// =============================================================================

/**
 * Slack OAuth V2 access token response (success case).
 */
const SlackOAuthV2ResponseSchema = z.object({
  ok: z.literal(true),
  access_token: z.string(),
  token_type: z.string(),
  scope: z.string(),
  bot_user_id: z.string(),
  app_id: z.string(),
  team: z.object({ id: z.string(), name: z.string() }),
  authed_user: z.object({ id: z.string() }),
  enterprise: z.object({ id: z.string(), name: z.string() }).nullish(),
  is_enterprise_install: z.boolean().optional(),
});
export type SlackOAuthV2Response = z.infer<typeof SlackOAuthV2ResponseSchema>;

/**
 * Slack auth.test response (success case).
 */
const SlackAuthTestResponseSchema = z.object({
  ok: z.literal(true),
  url: z.string(),
  team: z.string(),
  user: z.string(),
  team_id: z.string(),
  user_id: z.string(),
  bot_id: z.string().optional(),
  enterprise_id: z.string().optional(),
});
export type SlackAuthTestResponse = z.infer<typeof SlackAuthTestResponseSchema>;

/**
 * Slack user object from users.info / users.list
 */
const SlackUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  real_name: z.string().optional(),
  deleted: z.boolean(),
  is_bot: z.boolean(),
  is_restricted: z.boolean().optional(),
  is_ultra_restricted: z.boolean().optional(),
  profile: z.object({
    email: z.string().optional(),
    display_name: z.string().optional(),
    real_name: z.string().optional(),
    image_48: z.string().optional(),
  }),
});
export type SlackUser = z.infer<typeof SlackUserSchema>;

/** Wraps a single user from users.info */
const SlackUserInfoResponseSchema = z.object({
  ok: z.literal(true),
  user: SlackUserSchema,
});

/** Wraps member array + pagination cursor from users.list */
const SlackUsersListResponseSchema = z.object({
  ok: z.literal(true),
  members: z.array(SlackUserSchema),
  response_metadata: z.object({ next_cursor: z.string().optional() }).optional(),
});

/** Response from views.open — includes the created view ID */
const SlackViewResponseSchema = z.object({
  ok: z.literal(true),
  view: z.object({ id: z.string() }),
});

/** Response from chat.postMessage — includes the message timestamp */
const SlackPostMessageResponseSchema = z.object({
  ok: z.literal(true),
  ts: z.string(),
});

/** Response from chat.getPermalink */
const SlackPermalinkResponseSchema = z.object({
  ok: z.literal(true),
  permalink: z.string(),
});

/** Minimal ok-only response for views.publish, views.update */
const SlackOkResponseSchema = z.object({
  ok: z.literal(true),
});

/** Slack error envelope — used to extract the error string on failure */
const SlackErrorEnvelopeSchema = z.object({
  ok: z.literal(false),
  error: z.string().optional(),
});

// =============================================================================
// Request helper
// =============================================================================

type SlackRequestOptions<T> = {
  operation: string;
  url: string;
  init: RequestInit;
  schema: z.ZodType<T>;
  captureContext?: Record<string, unknown>;
};

/**
 * Unified Slack API request handler.
 * Handles fetch, HTTP status check, JSON parsing, Zod validation,
 * and error logging/capture in a single place.
 */
async function slackRequest<T>(opts: SlackRequestOptions<T>): Promise<T | null> {
  try {
    const response = await fetch(opts.url, opts.init);

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn({ status: response.status, error: errorText }, `${opts.operation} failed`);
      captureException(new Error(`${opts.operation} failed`), undefined, {
        operation: opts.operation,
        status: response.status,
        error_text: errorText,
        ...opts.captureContext,
      });
      return null;
    }

    const json = await response.json();
    const result = opts.schema.safeParse(json);

    if (result.success) {
      return result.data;
    }

    // Parse failed — likely ok:false from Slack. Extract error message.
    const errorEnvelope = SlackErrorEnvelopeSchema.safeParse(json);
    const slackError = errorEnvelope.success ? errorEnvelope.data.error : undefined;

    logger.warn({ error: slackError }, `${opts.operation} returned invalid response`);
    captureException(new Error(`${opts.operation} returned invalid response`), undefined, {
      operation: opts.operation,
      slack_error: slackError,
      ...opts.captureContext,
    });
    return null;
  } catch (error) {
    logger.error({ error }, `${opts.operation} error`);
    captureException(error, undefined, {
      operation: opts.operation,
      ...opts.captureContext,
    });
    return null;
  }
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
  const credentials = Buffer.from(`${env.slack.clientId}:${env.slack.clientSecret}`).toString(
    'base64'
  );

  const body = new URLSearchParams({
    code,
    redirect_uri: env.slack.redirectUri,
    grant_type: 'authorization_code',
  });

  return slackRequest({
    operation: 'slack_token_exchange',
    url: 'https://slack.com/api/oauth.v2.access',
    init: {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    },
    schema: SlackOAuthV2ResponseSchema,
  });
}

// =============================================================================
// API Methods
// =============================================================================

/**
 * Test authentication and get bot/team info
 * POST to auth.test with the bot token
 */
export async function authTest(accessToken: string): Promise<SlackAuthTestResponse | null> {
  return slackRequest({
    operation: 'slack_auth_test',
    url: 'https://slack.com/api/auth.test',
    init: {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    schema: SlackAuthTestResponseSchema,
  });
}

/**
 * Get user info by user ID
 */
export async function getUserInfo(accessToken: string, userId: string): Promise<SlackUser | null> {
  const params = new URLSearchParams({ user: userId });
  const result = await slackRequest({
    operation: 'slack_get_user_info',
    url: `https://slack.com/api/users.info?${params.toString()}`,
    init: { headers: { Authorization: `Bearer ${accessToken}` } },
    schema: SlackUserInfoResponseSchema,
    captureContext: { user_id: userId },
  });
  return result?.user ?? null;
}

/**
 * Look up a Slack user by email address.
 * Requires `users:read.email` bot scope.
 */
export async function lookupByEmail(accessToken: string, email: string): Promise<SlackUser | null> {
  const params = new URLSearchParams({ email });
  const result = await slackRequest({
    operation: 'slack_lookup_by_email',
    url: `https://slack.com/api/users.lookupByEmail?${params.toString()}`,
    init: { headers: { Authorization: `Bearer ${accessToken}` } },
    schema: SlackUserInfoResponseSchema,
    captureContext: { email },
  });
  return result?.user ?? null;
}

/**
 * List workspace members (single page, capped at SLACK_MEMBER_FETCH_LIMIT).
 * Filters out bots, deleted users, and users without an email address.
 * Requires `users:read` and `users:read.email` bot scopes.
 */
export async function listUsers(accessToken: string): Promise<SlackUser[]> {
  const params = new URLSearchParams({ limit: String(SLACK_MEMBER_FETCH_LIMIT) });
  const result = await slackRequest({
    operation: 'slack_list_users',
    url: `https://slack.com/api/users.list?${params.toString()}`,
    init: { headers: { Authorization: `Bearer ${accessToken}` } },
    schema: SlackUsersListResponseSchema,
  });

  if (!result) return [];

  return result.members.filter(
    (member) =>
      !member.deleted &&
      !member.is_bot &&
      !member.is_restricted &&
      !member.is_ultra_restricted &&
      !!member.profile.email
  );
}

/**
 * List all workspace members with cursor-based pagination.
 * Filters out bots, deleted users, restricted/ultra-restricted guests.
 * Does not require email — returns user IDs for view broadcasting.
 */
export async function listUsersAll(accessToken: string): Promise<SlackUser[]> {
  const allMembers: SlackUser[] = [];
  let cursor: string | undefined;

  try {
    do {
      const params = new URLSearchParams({ limit: '200' });
      if (cursor) params.set('cursor', cursor);

      const result = await slackRequest({
        operation: 'slack_list_users_all',
        url: `https://slack.com/api/users.list?${params.toString()}`,
        init: { headers: { Authorization: `Bearer ${accessToken}` } },
        schema: SlackUsersListResponseSchema,
      });

      if (!result) break;

      const filtered = result.members.filter(
        (member) =>
          !member.deleted && !member.is_bot && !member.is_restricted && !member.is_ultra_restricted
      );
      allMembers.push(...filtered);

      cursor = result.response_metadata?.next_cursor || undefined;
    } while (cursor);
  } catch (error) {
    logger.error({ error }, 'slack_list_users_all error');
    captureException(error, undefined, { operation: 'slack_list_users_all' });
  }

  return allMembers;
}

/**
 * Publish or update a user's App Home tab view
 */
export async function publishView(
  accessToken: string,
  userId: string,
  view: Record<string, unknown>
): Promise<boolean> {
  const result = await slackRequest({
    operation: 'slack_publish_view',
    url: 'https://slack.com/api/views.publish',
    init: {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId, view }),
    },
    schema: SlackOkResponseSchema,
    captureContext: { user_id: userId },
  });
  return result !== null;
}

/**
 * Open a modal view in Slack.
 * Returns the Slack-assigned view ID on success (needed for views.update),
 * or null on failure.
 */
export async function openModal(
  accessToken: string,
  triggerId: string,
  view: Record<string, unknown>
): Promise<string | null> {
  const result = await slackRequest({
    operation: 'slack_open_modal',
    url: 'https://slack.com/api/views.open',
    init: {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trigger_id: triggerId, view }),
    },
    schema: SlackViewResponseSchema,
    captureContext: { trigger_id: triggerId },
  });
  return result?.view.id ?? null;
}

/**
 * Update an existing modal view in Slack.
 * Used to replace a loading/placeholder modal with the real content
 * after async work completes.
 */
export async function updateModal(
  accessToken: string,
  viewId: string,
  view: Record<string, unknown>
): Promise<boolean> {
  const result = await slackRequest({
    operation: 'slack_update_modal',
    url: 'https://slack.com/api/views.update',
    init: {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ view_id: viewId, view }),
    },
    schema: SlackOkResponseSchema,
    captureContext: { view_id: viewId },
  });
  return result !== null;
}

/**
 * Get a permalink URL for a specific message in a channel.
 * Returns the permalink string on success, null on failure.
 * Read-only API — no additional scopes required.
 */
export async function getPermalink(
  accessToken: string,
  channel: string,
  messageTs: string
): Promise<string | null> {
  const params = new URLSearchParams({ channel, message_ts: messageTs });
  const result = await slackRequest({
    operation: 'slack_get_permalink',
    url: `https://slack.com/api/chat.getPermalink?${params.toString()}`,
    init: { headers: { Authorization: `Bearer ${accessToken}` } },
    schema: SlackPermalinkResponseSchema,
    captureContext: { channel },
  });
  return result?.permalink ?? null;
}

/**
 * Post a message to a Slack channel
 * Returns the message timestamp (ts) on success, null on failure
 */
export async function postMessage(
  accessToken: string,
  channel: string,
  blocks: unknown[],
  text: string,
  threadTs?: string
): Promise<string | null> {
  const result = await slackRequest({
    operation: 'slack_post_message',
    url: 'https://slack.com/api/chat.postMessage',
    init: {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel,
        blocks,
        text,
        ...(threadTs ? { thread_ts: threadTs } : {}),
      }),
    },
    schema: SlackPostMessageResponseSchema,
    captureContext: { channel },
  });
  return result?.ts ?? null;
}

/**
 * Send a deferred response to a Slack response_url webhook.
 *
 * Slash commands include a short-lived `response_url` that accepts POST
 * requests for up to 30 minutes. This lets us acknowledge the command
 * with an immediate HTTP 200 and deliver the real reply (or error)
 * asynchronously — avoiding the 3-second `operation_timeout`.
 *
 * The webhook is pre-authenticated, so no Authorization header is needed.
 * Slack returns plain-text "ok" (not JSON) on success.
 */
export async function respondToUrl(
  responseUrl: string,
  payload: {
    response_type?: 'ephemeral' | 'in_channel';
    text: string;
    blocks?: unknown[];
    delete_original?: boolean;
  }
): Promise<boolean> {
  try {
    const response = await fetch(responseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response_type: payload.response_type ?? 'ephemeral',
        text: payload.text,
        blocks: payload.blocks,
        ...(payload.delete_original ? { delete_original: true } : {}),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn({ status: response.status, error: errorText }, 'response_url POST failed');
      captureException(new Error('slack response_url POST failed'), undefined, {
        operation: 'slack_respond_to_url',
        status: response.status,
        error_text: errorText,
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error({ error }, 'response_url error');
    captureException(error, undefined, { operation: 'slack_respond_to_url' });
    return false;
  }
}
