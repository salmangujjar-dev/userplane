/**
 * Slack Block Kit Builders
 *
 * Pure functions that return Slack Block Kit JSON structures for views and messages.
 * Constants for action_ids, block_ids, and callback_ids used across the Slack integration.
 *
 * @see https://api.slack.com/block-kit
 */

// =============================================================================
// Constants
// =============================================================================

export const SlackActionIds = {
  CREATE_LINK: 'create_link_action',
  SELECT_PROJECT: 'select_project',
  SELECT_DOMAIN: 'select_domain',
  SLUG_INPUT: 'slug_input',
} as const;

export const SlackBlockIds = {
  PROJECT: 'project_block',
  DOMAIN: 'domain_block',
  SLUG: 'slug_block',
} as const;

export const SlackCallbackIds = {
  CREATE_LINK_MODAL: 'create_link_modal',
} as const;

// =============================================================================
// View Builders (Home Tab & Modals)
// =============================================================================

/**
 * Home tab view for connected users.
 * Shows workspace info, dashboard link, and a "Create Link" action button.
 */
export function buildHomeTabConnectedView(params: { workspaceName: string; dashboardUrl: string }) {
  return {
    type: 'home' as const,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'Welcome to Userplane',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Workspace:* ${params.workspaceName}\n<${params.dashboardUrl}|Open Dashboard>`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Create Link',
            },
            action_id: SlackActionIds.CREATE_LINK,
            style: 'primary',
          },
        ],
      },
    ],
  };
}

/**
 * Home tab view for users whose Slack workspace is not connected to Userplane.
 * Prompts them to connect via the dashboard.
 */
export function buildHomeTabDisconnectedView(params: { dashboardUrl: string }) {
  return {
    type: 'home' as const,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'Connect to Userplane',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Your Slack workspace is not connected to Userplane. Connect your workspace from the dashboard to get started.',
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Open Dashboard',
            },
            url: params.dashboardUrl,
          },
        ],
      },
    ],
  };
}

/**
 * Home tab view for users who are not members of the connected workspace.
 */
export function buildHomeTabNotMemberView() {
  return {
    type: 'home' as const,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'Access Denied',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'You are not a member of the connected Userplane workspace. Please ask a workspace admin to add you as a member.',
        },
      },
    ],
  };
}

/**
 * Modal view for creating a new link.
 * Includes project/domain selectors and an optional custom slug input.
 */
export function buildLinkCreatorModal(params: {
  projects: Array<{ id: string; name: string }>;
  domains: Array<{ id: string; domain: string }>;
}) {
  return {
    type: 'modal' as const,
    callback_id: SlackCallbackIds.CREATE_LINK_MODAL,
    title: {
      type: 'plain_text',
      text: 'Create Link',
    },
    submit: {
      type: 'plain_text',
      text: 'Create',
    },
    close: {
      type: 'plain_text',
      text: 'Cancel',
    },
    blocks: [
      {
        type: 'input',
        block_id: SlackBlockIds.PROJECT,
        label: {
          type: 'plain_text',
          text: 'Project',
        },
        element: {
          type: 'static_select',
          action_id: SlackActionIds.SELECT_PROJECT,
          placeholder: {
            type: 'plain_text',
            text: 'Select a project',
          },
          options: params.projects.map((p) => ({
            text: {
              type: 'plain_text' as const,
              text: p.name,
            },
            value: p.id,
          })),
        },
      },
      {
        type: 'input',
        block_id: SlackBlockIds.DOMAIN,
        label: {
          type: 'plain_text',
          text: 'Domain',
        },
        element: {
          type: 'static_select',
          action_id: SlackActionIds.SELECT_DOMAIN,
          placeholder: {
            type: 'plain_text',
            text: 'Select a domain',
          },
          options: params.domains.map((d) => ({
            text: {
              type: 'plain_text' as const,
              text: d.domain,
            },
            value: d.id,
          })),
        },
      },
      {
        type: 'input',
        block_id: SlackBlockIds.SLUG,
        optional: true,
        label: {
          type: 'plain_text',
          text: 'Custom Slug',
        },
        element: {
          type: 'plain_text_input',
          action_id: SlackActionIds.SLUG_INPUT,
          placeholder: {
            type: 'plain_text',
            text: 'Enter a custom slug (optional)',
          },
        },
      },
    ],
  };
}

/**
 * Modal view shown after a link is successfully created.
 * Displays the link URL and a creation timestamp.
 */
export function buildLinkSuccessView(params: { linkUrl: string }) {
  return {
    type: 'modal' as const,
    title: {
      type: 'plain_text',
      text: 'Link Created',
    },
    close: {
      type: 'plain_text',
      text: 'Close',
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Your link has been created:\n<${params.linkUrl}|${params.linkUrl}>`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Created at <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toISOString()}>`,
          },
        ],
      },
    ],
  };
}

// =============================================================================
/**
 * Modal view shown when an error occurs during view submission.
 * Replaces the form with a user-facing error message.
 */
export function buildErrorModalView(message: string) {
  return {
    type: 'modal' as const,
    title: {
      type: 'plain_text',
      text: 'Error',
    },
    close: {
      type: 'plain_text',
      text: 'Close',
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
    ],
  };
}

// Message Builders
// =============================================================================

/**
 * Block Kit message for notifying a channel that a link was created.
 * Includes a `text` fallback for push notifications.
 */
export function buildLinkCreatedMessage(params: {
  linkUrl: string;
  projectName: string;
  createdBy: string;
}) {
  return {
    text: `New link created: ${params.linkUrl}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*New Link Created*\n<${params.linkUrl}|${params.linkUrl}>\n*Project:* ${params.projectName}`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Created by ${params.createdBy}`,
          },
        ],
      },
    ],
  };
}

/**
 * Block Kit message for notifying a channel that a recording was received.
 * Includes a `text` fallback for push notifications.
 */
export function buildRecordingReceivedMessage(params: { recordingUrl: string }) {
  return {
    text: 'New recording received',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'Recording Received',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `A new recording has been submitted. <${params.recordingUrl}|View Recording>`,
        },
      },
    ],
  };
}

/**
 * Simple ephemeral error message blocks.
 */
export function buildErrorEphemeral(message: string) {
  return {
    text: message,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:warning: ${message}`,
        },
      },
    ],
  };
}
