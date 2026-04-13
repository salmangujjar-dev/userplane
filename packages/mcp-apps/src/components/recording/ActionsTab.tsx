import { useMemo, useState } from 'react';

import { cn, formatTimestamp, safeStringify, useToggleSet } from '../../utils';
import { DetailTabButton, EmptyState, FilterPill, SearchInput } from '../shared';
import {
  ArrowRightIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeOffIcon,
  GlobeIcon,
  LogInIcon,
  LogOutIcon,
  MousePointer2Icon,
  PauseIcon,
  PlayIcon,
  RefreshCwIcon,
} from '../shared/icons';
import type { ActionLogEntry } from './types';

interface ActionsTabProps {
  data: ActionLogEntry[];
  recordingStartTime?: number;
}

const ACTION_TYPES = [
  {
    type: 'click',
    label: 'Clicks',
    pastLabel: 'Clicked',
    icon: MousePointer2Icon,
    color: 'text-blue-500',
  },
  {
    type: 'navigate',
    label: 'Navigation',
    pastLabel: 'Navigated',
    icon: GlobeIcon,
    color: 'text-green-500',
  },
  {
    type: 'spa_route',
    label: 'SPA Route',
    pastLabel: 'SPA Route',
    icon: RefreshCwIcon,
    color: 'text-purple-500',
  },
  {
    type: 'tab_activated',
    label: 'Tab Active',
    pastLabel: 'Tab Activated',
    icon: EyeIcon,
    color: 'text-cyan-500',
  },
  {
    type: 'tab_deactivated',
    label: 'Tab Inactive',
    pastLabel: 'Tab Deactivated',
    icon: EyeOffIcon,
    color: 'text-gray-500',
  },
  {
    type: 'tab_switch',
    label: 'Tab Switch',
    pastLabel: 'Tab Switched',
    icon: ArrowRightIcon,
    color: 'text-orange-500',
  },
  {
    type: 'init_page',
    label: 'Page Init',
    pastLabel: 'Page Initialized',
    icon: LogInIcon,
    color: 'text-green-500',
  },
  {
    type: 'page_unload',
    label: 'Unload',
    pastLabel: 'Page Unloaded',
    icon: LogOutIcon,
    color: 'text-red-500',
  },
  {
    type: 'recorder-pause',
    label: 'Pause',
    pastLabel: 'Recording Paused',
    icon: PauseIcon,
    color: 'text-yellow-500',
  },
  {
    type: 'recorder-resume',
    label: 'Resume',
    pastLabel: 'Recording Resumed',
    icon: PlayIcon,
    color: 'text-green-500',
  },
] as const;

type ActionType = (typeof ACTION_TYPES)[number];

const ACTION_TYPE_BY_KEY = new Map<string, ActionType>(ACTION_TYPES.map((t) => [t.type, t]));
const DEFAULT_ACTION_TYPE: ActionType = ACTION_TYPE_BY_KEY.get('click')!;

function getActionTypeConfig(type: string): ActionType {
  return ACTION_TYPE_BY_KEY.get(type) ?? DEFAULT_ACTION_TYPE;
}

function getActionLabel(type: string): string {
  return ACTION_TYPE_BY_KEY.get(type)?.pastLabel ?? type;
}

const KNOWN_ACTION_KEYS = new Set([
  'type',
  'timestamp',
  'url',
  'pageTitle',
  'method',
  'triggeredBy',
  'tabId',
  'from',
  'to',
  'element',
]);

export function ActionsTab({ data, recordingStartTime }: ActionsTabProps) {
  const [search, setSearch] = useState('');
  const [activeFilters, toggleFilter] = useToggleSet<string>();

  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    return data.filter((entry) => {
      const actionType = entry.data?.type ?? 'unknown';
      if (activeFilters.size > 0 && !activeFilters.has(actionType)) return false;
      if (needle && !safeStringify(entry.data).toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [data, activeFilters, search]);

  // Determine which filter pills to show (only types present in data)
  const presentTypes = useMemo(() => {
    const types = new Set(data.map((e) => e.data?.type));
    return ACTION_TYPES.filter((t) => types.has(t.type));
  }, [data]);

  if (data.length === 0) {
    return (
      <EmptyState
        icon={MousePointer2Icon}
        title="No user actions"
        description="No user interactions were captured during this recording."
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search and filters */}
      <div className="p-4 space-y-3 border-b">
        <SearchInput value={search} onChange={setSearch} placeholder="Search actions..." />
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {presentTypes.map((type) => (
            <FilterPill
              key={type.type}
              label={type.label}
              active={activeFilters.has(type.type)}
              onClick={() => toggleFilter(type.type)}
            />
          ))}
        </div>
      </div>

      {/* Action entries */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No matching actions</div>
        ) : (
          filtered.map((entry, i) => (
            <ActionEntryRow
              key={`${entry.timestamp}-${i}`}
              entry={entry}
              recordingStartTime={recordingStartTime}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Action entry row
// ---------------------------------------------------------------------------

function ActionEntryRow({
  entry,
  recordingStartTime,
}: {
  entry: ActionLogEntry;
  recordingStartTime?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<
    'details' | 'element' | 'navigation' | 'data'
  >('details');

  const actionType = entry.data?.type ?? 'click';
  const typeConfig = getActionTypeConfig(actionType);
  const TypeIcon = typeConfig.icon;

  const elementDisplay = getElementDisplay(entry);
  const hasNavigation = Boolean(entry.data?.from || entry.data?.to);
  const hasElement = Boolean(entry.data?.element && Object.keys(entry.data.element).length > 0);

  // Collect extra data keys (exclude known ones)
  const extraData = useMemo(() => {
    if (!entry.data) return {};
    return Object.fromEntries(
      Object.entries(entry.data).filter(([k]) => !KNOWN_ACTION_KEYS.has(k))
    );
  }, [entry.data]);
  const hasExtraData = Object.keys(extraData).length > 0;

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-accent/50 text-left transition-colors cursor-pointer"
      >
        {/* Timestamp */}
        <span className="text-xs font-family-geist-mono text-muted-foreground shrink-0 pt-0.5 w-12">
          {formatTimestamp(entry.timestamp, recordingStartTime)}
        </span>

        {/* Action icon */}
        <TypeIcon className={cn('size-4 shrink-0 mt-0.5', typeConfig.color)} />

        {/* Action info */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium">{getActionLabel(actionType)}</span>
          {elementDisplay && (
            <span className="text-xs font-family-geist-mono text-muted-foreground ml-2 truncate">
              {elementDisplay}
            </span>
          )}
          {entry.data?.url && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{entry.data.url}</p>
          )}
        </div>

        {/* Expand */}
        <ChevronRightIcon
          className={cn(
            'size-4 text-muted-foreground shrink-0 mt-0.5 transition-transform',
            expanded && 'rotate-90'
          )}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-3 ml-[76px]">
          {/* Detail tabs */}
          <div className="flex gap-4 mb-2 border-b" role="tablist">
            <DetailTabButton
              active={activeDetailTab === 'details'}
              onClick={() => setActiveDetailTab('details')}
            >
              Details
            </DetailTabButton>
            {hasElement && (
              <DetailTabButton
                active={activeDetailTab === 'element'}
                onClick={() => setActiveDetailTab('element')}
              >
                Element
              </DetailTabButton>
            )}
            {hasNavigation && (
              <DetailTabButton
                active={activeDetailTab === 'navigation'}
                onClick={() => setActiveDetailTab('navigation')}
              >
                Navigation
              </DetailTabButton>
            )}
            {hasExtraData && (
              <DetailTabButton
                active={activeDetailTab === 'data'}
                onClick={() => setActiveDetailTab('data')}
              >
                Data
              </DetailTabButton>
            )}
          </div>

          {activeDetailTab === 'details' && (
            <div className="space-y-0.5">
              <DetailRow label="Action" value={getActionLabel(actionType)} />
              <DetailRow label="Timestamp" value={new Date(entry.timestamp).toISOString()} />
              {entry.data?.url && <DetailRow label="URL" value={entry.data.url} />}
              {entry.data?.pageTitle && (
                <DetailRow label="Page Title" value={entry.data.pageTitle} />
              )}
              {entry.data?.method && <DetailRow label="Method" value={entry.data.method} />}
              {entry.data?.triggeredBy && (
                <DetailRow label="Triggered By" value={entry.data.triggeredBy} />
              )}
              {entry.data?.tabId && <DetailRow label="Tab ID" value={entry.data.tabId} />}
            </div>
          )}

          {activeDetailTab === 'element' && entry.data?.element && (
            <div className="space-y-0.5">
              {entry.data.element.tag && (
                <DetailRow label="Tag" value={`<${entry.data.element.tag}>`} />
              )}
              {entry.data.element.id && <DetailRow label="ID" value={entry.data.element.id} />}
              {entry.data.element.classes && entry.data.element.classes.length > 0 && (
                <DetailRow label="Classes" value={entry.data.element.classes.join(', ')} />
              )}
              {entry.data.element.selector && (
                <DetailRow label="Selector" value={entry.data.element.selector} />
              )}
            </div>
          )}

          {activeDetailTab === 'navigation' && (
            <div className="space-y-0.5">
              {entry.data?.from && <DetailRow label="From" value={entry.data.from} />}
              {entry.data?.to && <DetailRow label="To" value={entry.data.to} />}
            </div>
          )}

          {activeDetailTab === 'data' && hasExtraData && (
            <pre className="text-xs font-family-geist-mono bg-muted/50 rounded-md p-2 overflow-x-auto whitespace-pre-wrap max-h-40">
              {safeStringify(extraData, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-xs font-family-geist-mono">
      <span className="text-muted-foreground shrink-0 min-w-[100px]">{label}</span>
      <span className="break-all">{value}</span>
    </div>
  );
}

function getElementDisplay(entry: ActionLogEntry): string | null {
  const el = entry.data?.element;
  if (!el) return null;

  let display = '';
  if (el.tag) display += `<${el.tag}`;
  if (el.id) display += ` id="${el.id}"`;
  if (el.classes && el.classes.length > 0) display += ` class="${el.classes.join(' ')}"`;
  if (el.tag) display += '>';

  return display || null;
}
