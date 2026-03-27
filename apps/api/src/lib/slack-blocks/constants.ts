/**
 * Slack Block Kit Constants
 *
 * Action IDs, Block IDs, and Callback IDs used across the Slack integration.
 * These must stay stable — Slack stores them in interaction payloads.
 */

export const SlackActionIds = {
  CREATE_LINK: 'create_link_action',
  LINK_REFERENCE_INPUT: 'link_reference_input',
  SELECT_PROJECT: 'select_project',
  SELECT_DOMAIN: 'select_domain',
  CUSTOM_MESSAGE_INPUT: 'custom_message_input',
  VIEW_RECORDINGS: 'view_recordings_action',
  // URL-only button action IDs (required by Slack even for link buttons)
  CONNECT_WORKSPACE: 'connect_workspace_action',
  REQUEST_ACCESS: 'request_access_action',
  CONTACT_SUPPORT: 'contact_support_action',
  OPEN_LINK: 'open_link_action',
  VIEW_DASHBOARD: 'view_dashboard_action',
  VIEW_RECORDING: 'view_recording_action',
  UPGRADE_WORKSPACE: 'upgrade_workspace_action',
} as const;

export const SlackBlockIds = {
  LINK_REFERENCE: 'link_reference_block',
  PROJECT: 'project_block',
  DOMAIN: 'domain_block',
  CUSTOM_MESSAGE: 'custom_message_block',
} as const;

export const SlackCallbackIds = {
  CREATE_LINK_MODAL: 'create_link_modal',
} as const;
