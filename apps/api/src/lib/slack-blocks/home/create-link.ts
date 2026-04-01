/**
 * Home Tab - Create Link View
 * Inline link creation form rendered in the home tab.
 * Used when the user taps "Create Link" from the connected home view.
 */

import { SlackActionIds } from '../constants';

/**
 * Build the home tab create link form.
 * Shows project/domain selectors and a create button.
 */
export function buildHomeCreateLinkView(params: {
  projects: Array<{ id: string; name: string }>;
  domains: Array<{ id: string; domain: string }>;
}) {
  return {
    type: 'home' as const,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: 'Create a link' },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Create a recording link for customer',
        },
      },
      { type: 'divider' },
      {
        type: 'input',
        block_id: 'project_block',
        label: { type: 'plain_text', text: 'Project' },
        hint: { type: 'plain_text', text: 'Select the project for your recordings' },
        element: {
          type: 'static_select',
          action_id: SlackActionIds.SELECT_PROJECT,
          placeholder: {
            type: 'plain_text',
            text: 'Choose a project',
          },
          options: params.projects.map((p) => ({
            text: { type: 'plain_text' as const, text: p.name },
            value: p.id,
          })),
          ...(params.projects[0]
            ? {
                initial_option: {
                  text: { type: 'plain_text' as const, text: params.projects[0].name },
                  value: params.projects[0].id,
                },
              }
            : {}),
        },
      },
      {
        type: 'input',
        block_id: 'domain_block',
        label: { type: 'plain_text', text: 'Domain' },
        hint: { type: 'plain_text', text: 'Select the domain for your recording link' },
        element: {
          type: 'static_select',
          action_id: SlackActionIds.SELECT_DOMAIN,
          placeholder: {
            type: 'plain_text',
            text: 'Choose a domain',
          },
          options: params.domains.map((d) => ({
            text: { type: 'plain_text' as const, text: d.domain },
            value: d.id,
          })),
          ...(params.domains[0]
            ? {
                initial_option: {
                  text: { type: 'plain_text' as const, text: params.domains[0].domain },
                  value: params.domains[0].id,
                },
              }
            : {}),
        },
      },
      { type: 'divider' },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Create',
            },
            action_id: SlackActionIds.CREATE_LINK_SUBMIT,
            style: 'primary',
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Back to Home',
            },
            action_id: SlackActionIds.HOME_BACK,
          },
        ],
      },
    ],
  };
}
