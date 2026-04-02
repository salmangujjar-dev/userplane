/**
 * Home Tab - Browse Recordings View
 * Full recordings list with filter controls and pagination.
 * Rendered when the user taps "View All" on the recordings section.
 */

import { SlackActionIds } from '../constants';
import type { HomeRecordingItem } from './connected';

export interface RecordingFilterState {
  projectId?: string;
  domainId?: string;
  dateRange?: string;
}

/** Items per page for browse views */
export const BROWSE_PAGE_SIZE = 10;

/**
 * Build the home tab browse recordings view with filter controls and pagination.
 */
export function buildHomeBrowseRecordingsView(params: {
  projects: Array<{ id: string; name: string }>;
  domains: Array<{ id: string; domain: string }>;
  recordings: HomeRecordingItem[];
  total: number;
  page: number;
  selectedFilters?: RecordingFilterState;
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

  const dateOptions = [
    { text: { type: 'plain_text' as const, text: 'Last 7 days' }, value: '7d' },
    { text: { type: 'plain_text' as const, text: 'Last 30 days' }, value: '30d' },
    { text: { type: 'plain_text' as const, text: 'All time' }, value: 'all' },
  ];

  const selectedProject = params.selectedFilters?.projectId ?? 'all';
  const selectedDomain = params.selectedFilters?.domainId ?? 'all';
  const selectedDate = params.selectedFilters?.dateRange ?? '7d';

  const totalPages = Math.max(1, Math.ceil(params.total / BROWSE_PAGE_SIZE));
  const hasPrev = params.page > 1;
  const hasNext = params.page < totalPages;

  const blocks: Array<Record<string, unknown>> = [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Recordings' },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Screen recordings submitted by your team.',
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'static_select',
          action_id: SlackActionIds.FILTER_RECORDINGS_PROJECT,
          placeholder: { type: 'plain_text', text: 'Project' },
          options: projectOptions,
          initial_option:
            projectOptions.find((o) => o.value === selectedProject) ?? projectOptions[0],
        },
        {
          type: 'static_select',
          action_id: SlackActionIds.FILTER_RECORDINGS_DOMAIN,
          placeholder: { type: 'plain_text', text: 'Domain' },
          options: domainOptions,
          initial_option: domainOptions.find((o) => o.value === selectedDomain) ?? domainOptions[0],
        },
        {
          type: 'static_select',
          action_id: SlackActionIds.FILTER_RECORDINGS_DATE,
          placeholder: { type: 'plain_text', text: 'Date' },
          options: dateOptions,
          initial_option: dateOptions.find((o) => o.value === selectedDate) ?? dateOptions[0],
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Search' },
          action_id: SlackActionIds.FILTER_RECORDINGS_GO,
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

  if (params.recordings.length > 0) {
    for (const rec of params.recordings) {
      const block: Record<string, unknown> = {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${rec.title} Recording*\nRequested by ${rec.creatorName} \u00b7 ${rec.durationFormatted} \u00b7 <!date^${rec.createdAtTs}^{date_short_pretty}|${new Date(rec.createdAtTs * 1000).toLocaleDateString()}>`,
        },
      };

      if (rec.thumbnailUrl) {
        block.accessory = {
          type: 'image',
          image_url: rec.thumbnailUrl,
          alt_text: 'Recording thumbnail',
        };
      }

      blocks.push(block);
    }

    // Pagination controls
    if (hasPrev || hasNext) {
      const paginationElements: Array<Record<string, unknown>> = [];

      if (hasPrev) {
        paginationElements.push({
          type: 'button',
          text: { type: 'plain_text', text: 'Previous' },
          action_id: SlackActionIds.PAGE_RECORDINGS_PREV,
          value: String(params.page - 1),
        });
      }

      if (hasNext) {
        paginationElements.push({
          type: 'button',
          text: { type: 'plain_text', text: 'Next' },
          action_id: SlackActionIds.PAGE_RECORDINGS_NEXT,
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
      elements: [{ type: 'plain_text', text: 'No recordings match your filters.' }],
    });
  }

  return {
    type: 'home' as const,
    blocks,
  };
}
