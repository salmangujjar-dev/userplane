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
  // Home tab navigation
  BROWSE_RECORDINGS: 'browse_recordings_action',
  BROWSE_LINKS: 'browse_links_action',
  HOME_BACK: 'home_back_action',
  // Home tab create link flow
  CREATE_LINK_SUBMIT: 'create_link_submit_action',
  // Browse recordings filters
  FILTER_RECORDINGS_PROJECT: 'filter_recordings_project',
  FILTER_RECORDINGS_DOMAIN: 'filter_recordings_domain',
  FILTER_RECORDINGS_DATE: 'filter_recordings_date',
  FILTER_RECORDINGS_GO: 'filter_recordings_go',
  // Browse links filters
  FILTER_LINKS_PROJECT: 'filter_links_project',
  FILTER_LINKS_DOMAIN: 'filter_links_domain',
  FILTER_LINKS_STATUS: 'filter_links_status',
  FILTER_LINKS_GO: 'filter_links_go',
  // Pagination
  PAGE_RECORDINGS_PREV: 'page_recordings_prev',
  PAGE_RECORDINGS_NEXT: 'page_recordings_next',
  PAGE_LINKS_PREV: 'page_links_prev',
  PAGE_LINKS_NEXT: 'page_links_next',
  // URL-only button action IDs (required by Slack even for link buttons)
  CONNECT_WORKSPACE: 'connect_workspace_action',
  REQUEST_ACCESS: 'request_access_action',
  CONTACT_SUPPORT: 'contact_support_action',
  OPEN_LINK: 'open_link_action',
  VIEW_DASHBOARD: 'view_dashboard_action',
  VIEW_RECORDING: 'view_recording_action',
  VIEW_MESSAGE: 'view_message_action',
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
  CREATE_LINK_SHORTCUT: 'create_recording_link',
} as const;
