/**
 * Link Creator Modal
 * Modal view for creating a new recording link with project/domain selection
 * and an optional custom message.
 */

import { determineLinkTitle } from '@/api/lib/id';

import { SlackActionIds, SlackBlockIds, SlackCallbackIds } from '../constants';

/**
 * Fallback message when no user name is available.
 */
export const DEFAULT_RECORDING_MESSAGE =
  'Your support team has requested a screen recording from you';

/**
 * Build the link creator modal view.
 * Includes project/domain selectors, optional custom slug, and custom message.
 */
export function buildLinkCreatorModalView(params: {
  projects: Array<{ id: string; name: string }>;
  domains: Array<{ id: string; domain: string }>;
  /** User display name - used to personalise the default title and message. */
  userName: string;
  /** Optional text from slash command to pre-fill the link reference field. */
  linkReference?: string;
}) {
  const defaultMessage = `${params.userName} has requested a screen recording from you`;

  const defaultTitle = params.linkReference?.trim()
    ? params.linkReference.trim()
    : determineLinkTitle(null, params.userName);

  return {
    type: 'modal' as const,
    callback_id: SlackCallbackIds.CREATE_LINK_MODAL,
    title: {
      type: 'plain_text',
      text: 'New recording link',
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
        hint: {
          type: 'plain_text',
          text: 'Select the project for your recordings',
        },
        element: {
          type: 'static_select',
          action_id: SlackActionIds.SELECT_PROJECT,
          placeholder: {
            type: 'plain_text',
            text: 'Choose a project',
          },
          options: params.projects.map((p) => ({
            text: {
              type: 'plain_text' as const,
              text: p.name,
            },
            value: p.id,
          })),
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
        hint: {
          type: 'plain_text',
          text: 'Select the domain for your recording link',
        },
        element: {
          type: 'static_select',
          action_id: SlackActionIds.SELECT_DOMAIN,
          placeholder: {
            type: 'plain_text',
            text: 'Choose a domain',
          },
          options: params.domains.map((d) => ({
            text: {
              type: 'plain_text' as const,
              text: d.domain,
            },
            value: d.id,
          })),
          initial_option: params.domains[0]
            ? {
                text: { type: 'plain_text' as const, text: params.domains[0].domain },
                value: params.domains[0].id,
              }
            : undefined,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'input',
        block_id: SlackBlockIds.LINK_REFERENCE,
        optional: true,
        label: {
          type: 'plain_text',
          text: 'Link Reference',
        },
        hint: {
          type: 'plain_text',
          text: 'Add a link, ticket, issue number or customer reference',
        },
        element: {
          type: 'plain_text_input',
          action_id: SlackActionIds.LINK_REFERENCE_INPUT,
          initial_value: defaultTitle,
          placeholder: {
            type: 'plain_text',
            text: 'e.g. Login bug, Onboarding flow',
          },
        },
      },
      {
        type: 'input',
        block_id: SlackBlockIds.CUSTOM_MESSAGE,
        optional: true,
        label: {
          type: 'plain_text',
          text: 'Message for the recipient',
        },
        hint: {
          type: 'plain_text',
          text: 'Your customers would see this when you request a recording',
        },
        element: {
          type: 'plain_text_input',
          action_id: SlackActionIds.CUSTOM_MESSAGE_INPUT,
          multiline: true,
          initial_value: defaultMessage,
          placeholder: {
            type: 'plain_text',
            text: 'Hey - could you record your screen showing the issue?',
          },
        },
      },
    ],
  };
}
