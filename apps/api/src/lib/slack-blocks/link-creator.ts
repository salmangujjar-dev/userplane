/**
 * Link Creator Modal
 * Modal view for creating a new recording link with project/domain selection
 * and an optional custom message.
 */

import { determineLinkTitle } from '@/api/lib/id';

import { SlackActionIds, SlackBlockIds, SlackCallbackIds } from './constants';

/**
 * Fallback message when no user name is available.
 */
export const DEFAULT_RECORDING_MESSAGE =
  'Your support team has requested a screen recording from you';

/**
 * Build the link creator modal view.
 * Includes project/domain selectors, optional custom slug, and custom message.
 */
export function buildLinkCreatorModal(params: {
  projects: Array<{ id: string; name: string }>;
  domains: Array<{ id: string; domain: string }>;
  /** User display name — used to personalise the default title and message. */
  userName?: string;
}) {
  const defaultMessage = params.userName
    ? `${params.userName} has requested a screen recording from you`
    : DEFAULT_RECORDING_MESSAGE;

  const defaultTitle = determineLinkTitle(null, params.userName);

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
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Pick a project and domain for this recording link.',
        },
      },
      {
        type: 'input',
        block_id: SlackBlockIds.LINK_REFERENCE,
        optional: true,
        label: {
          type: 'plain_text',
          text: 'Title',
        },
        element: {
          type: 'plain_text_input',
          action_id: SlackActionIds.LINK_REFERENCE_INPUT,
          initial_value: defaultTitle,
          placeholder: {
            type: 'plain_text',
            text: 'e.g. Customer Issue, Bug Report',
          },
        },
      },
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
          // Pre-select the first project
          initial_option: params.projects[0]
            ? {
                text: { type: 'plain_text' as const, text: params.projects[0].name },
                value: params.projects[0].id,
              }
            : undefined,
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
          // Pre-select the first domain
          initial_option: params.domains[0]
            ? {
                text: { type: 'plain_text' as const, text: params.domains[0].domain },
                value: params.domains[0].id,
              }
            : undefined,
        },
      },
      {
        type: 'input',
        block_id: SlackBlockIds.CUSTOM_MESSAGE,
        optional: true,
        label: {
          type: 'plain_text',
          text: 'Message to recipient',
        },
        element: {
          type: 'plain_text_input',
          action_id: SlackActionIds.CUSTOM_MESSAGE_INPUT,
          initial_value: defaultMessage,
          placeholder: {
            type: 'plain_text',
            text: 'Enter a message for the recipient...',
          },
        },
      },
    ],
  };
}
