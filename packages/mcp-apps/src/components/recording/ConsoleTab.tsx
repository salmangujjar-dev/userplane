import { useMemo, useState } from 'react';

import { EmptyState, FilterPill, SearchInput } from '../shared';
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  BugIcon,
  ChevronRightIcon,
  InfoIcon,
  MessageSquareIcon,
} from '../components/icons';
import { cn, formatTimestamp } from '../../utils';
import type { ConsoleLogEntry } from './types';

interface ConsoleTabProps {
  data: ConsoleLogEntry[];
  recordingStartTime?: number;
}

const LOG_LEVELS = [
  { type: 'error', label: 'Error', icon: AlertCircleIcon, color: 'text-red-500' },
  { type: 'warning', label: 'Warning', icon: AlertTriangleIcon, color: 'text-yellow-500' },
  { type: 'info', label: 'Info', icon: InfoIcon, color: 'text-blue-500' },
  { type: 'log', label: 'Log', icon: MessageSquareIcon, color: 'text-muted-foreground' },
  { type: 'debug', label: 'Debug', icon: BugIcon, color: 'text-purple-500' },
] as const;

function getLevelConfig(type: string) {
  return LOG_LEVELS.find((l) => l.type === type) ?? LOG_LEVELS[3]; // default to 'log'
}

export function ConsoleTab({ data, recordingStartTime }: ConsoleTabProps) {
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  const toggleFilter = (type: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return data.filter((entry) => {
      if (activeFilters.size > 0 && !activeFilters.has(entry.type)) return false;
      if (search) {
        const text = JSON.stringify(entry.args).toLowerCase();
        if (!text.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [data, activeFilters, search]);

  if (data.length === 0) {
    return (
      <EmptyState
        icon={MessageSquareIcon}
        title="No console logs"
        description="No browser console logs were captured during this recording."
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search and filters */}
      <div className="p-4 space-y-3 border-b">
        <SearchInput value={search} onChange={setSearch} placeholder="Search console logs..." />
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {LOG_LEVELS.map((level) => (
            <FilterPill
              key={level.type}
              label={level.label}
              active={activeFilters.has(level.type)}
              onClick={() => toggleFilter(level.type)}
            />
          ))}
        </div>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No matching entries</div>
        ) : (
          filtered.map((entry, i) => (
            <ConsoleLogEntryRow
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
// Console log entry
// ---------------------------------------------------------------------------

function ConsoleLogEntryRow({
  entry,
  recordingStartTime,
}: {
  entry: ConsoleLogEntry;
  recordingStartTime?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const level = getLevelConfig(entry.type);
  const LevelIcon = level.icon;

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

        {/* Level icon */}
        <LevelIcon className={cn('size-4 shrink-0 mt-0.5', level.color)} />

        {/* Log content */}
        <span className="flex-1 text-sm font-family-geist-mono truncate">
          {formatArgs(entry.args)}
        </span>

        {/* Expand indicator */}
        <ChevronRightIcon
          className={cn(
            'size-4 text-muted-foreground shrink-0 mt-0.5 transition-transform',
            expanded && 'rotate-90'
          )}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-3 ml-[76px] space-y-2">
          {/* Full output */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Output</p>
            <pre className="text-xs font-family-geist-mono bg-muted/50 rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-all max-h-40">
              {entry.args.map((arg) => formatValue(arg)).join(' ')}
            </pre>
          </div>

          {/* Source */}
          {entry.url && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Source</p>
              <p className="text-xs font-family-geist-mono text-muted-foreground truncate">
                {entry.url}
              </p>
            </div>
          )}

          {/* Stack trace */}
          {entry.trace && entry.trace.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Stack Trace</p>
              <pre className="text-xs font-family-geist-mono bg-muted/50 rounded-md p-2 overflow-x-auto whitespace-pre-wrap max-h-40 text-muted-foreground">
                {entry.trace.join('\n')}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatArgs(args: unknown[]): string {
  return args
    .map((arg) => {
      if (typeof arg === 'string') return arg;
      if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
      if (arg === null || arg === undefined) return String(arg);
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(' ');
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
