/**
 * Home Tab - Browse Links View
 * Full links list with filter controls and pagination.
 * Rendered when the user taps "View All" on the links section.
 */

import { SlackActionIds } from '../constants';
import { slackCanvasUrls } from '../urls';
import { BROWSE_PAGE_SIZE } from './browse-recordings';

export interface HomeBrowseLinkItem {
  linkId: string;
  title: string;
  projectName: string;
  creatorName: string;
  domainName: string;
  /** Unix timestamp in seconds for Slack date formatting */
  createdAtTs: number;
  linkUrl: string;
  workspaceId: string;
}

export interface LinkFilterState {
  projectId?: string;
  domainId?: string;
  status?: string;
}

/**
 * Build the home tab browse links view with filter controls and pagination.
 */
export function buildHomeBrowseLinksView(params: {
  projects: Array<{ id: string; name: string }>;
  domains: Array<{ id: string; domain: string }>;
  links: HomeBrowseLinkItem[];
  total: number;
  page: number;
  dashboardUrl: string;
  selectedFilters?: LinkFilterState;
}) {
  const projectOptions = [
    { text: { type: 'plain_text' as const, text: 'All projects' }, value: 'all' },
    ...params.projects.map((p) => ({
      text: { type: 'plain_text' as const, text: p.name },
      value: p.id,
    })),
  ];

  const domainOptions = [
    { text: { type: 'plain_text' as const, text: 'All domains' }, value: 'all' },
    ...params.domains.map((d) => ({
      text: { type: 'plain_text' as const, text: d.domain },
      value: d.id,
    })),
  ];

  const statusOptions = [
    { text: { type: 'plain_text' as const, text: 'All' }, value: 'all' },
    { text: { type: 'plain_text' as const, text: 'Active' }, value: 'active' },
    { text: { type: 'plain_text' as const, text: 'Expired' }, value: 'expired' },
  ];

  const selectedProject = params.selectedFilters?.projectId ?? 'all';
  const selectedDomain = params.selectedFilters?.domainId ?? 'all';
  const selectedStatus = params.selectedFilters?.status ?? 'all';

  const totalPages = Math.max(1, Math.ceil(params.total / BROWSE_PAGE_SIZE));
  const hasPrev = params.page > 1;
  const hasNext = params.page < totalPages;

  const blocks: Array<Record<string, unknown>> = [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Recording Links' },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Recording links shared with your team.',
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'static_select',
          action_id: SlackActionIds.FILTER_LINKS_PROJECT,
          placeholder: { type: 'plain_text', text: 'Project' },
          options: projectOptions,
          initial_option:
            projectOptions.find((o) => o.value === selectedProject) ?? projectOptions[0],
        },
        {
          type: 'static_select',
          action_id: SlackActionIds.FILTER_LINKS_DOMAIN,
          placeholder: { type: 'plain_text', text: 'Domain' },
          options: domainOptions,
          initial_option: domainOptions.find((o) => o.value === selectedDomain) ?? domainOptions[0],
        },
        {
          type: 'static_select',
          action_id: SlackActionIds.FILTER_LINKS_STATUS,
          placeholder: { type: 'plain_text', text: 'Status' },
          options: statusOptions,
          initial_option: statusOptions.find((o) => o.value === selectedStatus) ?? statusOptions[0],
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Search' },
          action_id: SlackActionIds.FILTER_LINKS_GO,
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Back to Home' },
          action_id: SlackActionIds.HOME_BACK,
        },
      ],
    },
    { type: 'divider' },
  ];

  if (params.links.length > 0) {
    for (const link of params.links) {
      const viewUrl = slackCanvasUrls.linkRecordingsUrl(link.workspaceId, link.linkId);
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${link.title}*\nCreated by ${link.creatorName} \u00b7 <!date^${link.createdAtTs}^{date_short_pretty}|${new Date(link.createdAtTs * 1000).toLocaleDateString()}>`,
        },
        accessory: {
          type: 'button',
          text: { type: 'plain_text', text: 'View Recording' },
          action_id: SlackActionIds.VIEW_RECORDING,
          url: viewUrl,
        },
      });
    }

    // Pagination controls
    if (hasPrev || hasNext) {
      const paginationElements: Array<Record<string, unknown>> = [];

      if (hasPrev) {
        paginationElements.push({
          type: 'button',
          text: { type: 'plain_text', text: 'Previous' },
          action_id: SlackActionIds.PAGE_LINKS_PREV,
          value: String(params.page - 1),
        });
      }

      if (hasNext) {
        paginationElements.push({
          type: 'button',
          text: { type: 'plain_text', text: 'Next' },
          action_id: SlackActionIds.PAGE_LINKS_NEXT,
          value: String(params.page + 1),
        });
      }

      blocks.push({ type: 'divider' });
      blocks.push({
        type: 'context',
        elements: [{ type: 'plain_text', text: `Page ${params.page} of ${totalPages}` }],
      });
      blocks.push({ type: 'actions', elements: paginationElements });
    }
  } else {
    blocks.push({
      type: 'context',
      elements: [{ type: 'plain_text', text: 'No links match your filters.' }],
    });
  }

  return {
    type: 'home' as const,
    blocks,
  };
}
