'use client';

import { Button } from '@userplane/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@userplane/ui/components/dropdown-menu';
import { SearchInput } from '@userplane/ui/components/search-input';
import { Skeleton } from '@userplane/ui/components/skeleton';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, AlertTriangle, Bug, Filter, Info, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ConsolePanelEmptyState } from '../shared/empty-state';
import { ConsoleLogEntry } from './console-log-entry';
import type { RecordingConsoleLog } from './console-log-types';
import { createMockConsoleLog, LogLevel } from './console-log-types';
import { formatSerializedValue } from './console-log-types';
import { useRecordingPlayerSeek } from './recording-player-context';

const baseTime = Date.now() - 60000;

const mockLogs: RecordingConsoleLog[] = [
  createMockConsoleLog(baseTime, 'log', ['Application started'], 'app.js'),
  createMockConsoleLog(baseTime + 1333, 'info', ['User authentication successful'], 'auth.js'),
  createMockConsoleLog(baseTime + 2666, 'warning', ['Deprecated API usage detected'], 'api.js'),
  createMockConsoleLog(
    baseTime + 3999,
    'error',
    ['Failed to load resource: net::ERR_CONNECTION_REFUSED'],
    'api.js',
    ['at fetchData (api.js:45:12)', 'at loadUser (user.js:23:8)', 'at init (app.js:12:4)']
  ),
  createMockConsoleLog(
    baseTime + 6665,
    'debug',
    ['Component mounted: UserProfile'],
    'components.js'
  ),
  createMockConsoleLog(
    baseTime + 7998,
    'info',
    ['API response received in 234ms'],
    'api-client.js'
  ),
  createMockConsoleLog(
    baseTime + 9331,
    'warning',
    ['Memory usage high: 85% of heap'],
    'monitor.js'
  ),
  createMockConsoleLog(
    baseTime + 10664,
    'error',
    ['TypeError: Cannot read property "map" of undefined'],
    'list-view.js',
    ['at renderList (list-view.js:234:16)', 'at render (component.js:67:8)']
  ),
  createMockConsoleLog(baseTime + 11997, 'log', ['Fetching user preferences'], 'settings.js'),
  createMockConsoleLog(
    baseTime + 13330,
    'debug',
    ['WebSocket connection established'],
    'websocket.js'
  ),
  createMockConsoleLog(baseTime + 14663, 'info', ['Theme changed to dark mode'], 'theme.js'),
  createMockConsoleLog(
    baseTime + 15996,
    'warning',
    ['Slow network detected: 2G'],
    'network-monitor.js'
  ),
  createMockConsoleLog(
    baseTime + 17329,
    'log',
    [{ status: 'success', items: 42, hasMore: true }],
    'pagination.js'
  ),
  createMockConsoleLog(baseTime + 18662, 'debug', ['Redux store updated'], 'store.js'),
  createMockConsoleLog(baseTime + 19995, 'error', ['Failed to save to localStorage'], 'storage.js'),
  createMockConsoleLog(baseTime + 21328, 'info', ['Form validation passed'], 'form-validator.js'),
  createMockConsoleLog(baseTime + 22661, 'log', ['Animation completed'], 'animations.js'),
  createMockConsoleLog(
    baseTime + 23994,
    'warning',
    ['Image failed to load: avatar.png'],
    'image-loader.js'
  ),
  createMockConsoleLog(baseTime + 25327, 'debug', ['Cache cleared for user session'], 'cache.js'),
  createMockConsoleLog(
    baseTime + 26660,
    'error',
    ['Network request failed: 500 Internal Server Error'],
    'error-handler.js',
    ['at handleError (error-handler.js:123:24)', 'at fetch (api.js:45:12)']
  ),
  createMockConsoleLog(baseTime + 27993, 'info', ['User logged out successfully'], 'auth.js'),
  createMockConsoleLog(
    baseTime + 29000,
    'log',
    [
      'User data:',
      { type: 'element', tag: 'div', id: 'root', class: 'app-container' } as unknown as string,
    ],
    'debug.js'
  ),
  createMockConsoleLog(
    baseTime + 30000,
    'error',
    [
      {
        type: 'error',
        name: 'ReferenceError',
        message: 'x is not defined',
        stack: 'ReferenceError: x is not defined\n    at eval (app.js:1:1)',
      } as unknown as string,
    ],
    'eval.js'
  ),
  createMockConsoleLog(baseTime + 31000, 'log', [[1, 2, 3, 4, 5]], 'data.js'),
  createMockConsoleLog(baseTime + 33200, 'info', ['Background sync started'], 'sync.js'),
  createMockConsoleLog(
    baseTime + 35400,
    'debug',
    ['Revalidating cache key: dashboard.widgets'],
    'cache.js'
  ),
  createMockConsoleLog(
    baseTime + 37600,
    'warning',
    ['Retrying request after timeout: /api/metrics'],
    'network.js'
  ),
  createMockConsoleLog(
    baseTime + 39800,
    'log',
    [{ route: '/settings/profile', method: 'GET', durationMs: 128 }],
    'router.js'
  ),
  createMockConsoleLog(
    baseTime + 42000,
    'info',
    ['Feature flag loaded: new-onboarding'],
    'flags.js'
  ),
  createMockConsoleLog(
    baseTime + 44200,
    'error',
    ['Unhandled promise rejection: Request aborted'],
    'requests.js',
    ['at loadMetrics (requests.js:87:14)', 'at async initDashboard (dashboard.js:31:5)']
  ),
  createMockConsoleLog(baseTime + 46400, 'debug', ['Heartbeat acknowledged'], 'socket.js'),
  createMockConsoleLog(
    baseTime + 48600,
    'log',
    [{ action: 'expand-panel', panelId: 'console', source: 'keyboard-shortcut' }],
    'ui-events.js'
  ),
  createMockConsoleLog(
    baseTime + 50800,
    'warning',
    ['Long task detected: script evaluation exceeded 120ms'],
    'performance.js'
  ),
  createMockConsoleLog(baseTime + 53000, 'info', ['IndexedDB write complete'], 'storage.js'),
  createMockConsoleLog(baseTime + 55200, 'debug', ['Polling interval updated to 5s'], 'polling.js'),
  createMockConsoleLog(
    baseTime + 57400,
    'error',
    ['SyntaxError: Unexpected token "<" in JSON at position 0'],
    'json-parser.js',
    ['at parseResponse (json-parser.js:19:11)', 'at fetchConfig (config.js:42:9)']
  ),
  createMockConsoleLog(baseTime + 59600, 'log', ['Preparing analytics payload'], 'analytics.js'),
  createMockConsoleLog(baseTime + 61800, 'info', ['Upload progress: 45%'], 'uploader.js'),
  createMockConsoleLog(
    baseTime + 64000,
    'warning',
    ['Service worker update available'],
    'service-worker.js'
  ),
  createMockConsoleLog(
    baseTime + 66200,
    'debug',
    ['Applying optimistic update for ticket #1042'],
    'store.js'
  ),
  createMockConsoleLog(
    baseTime + 68400,
    'log',
    [{ breadcrumbs: ['home', 'projects', 'alpha'], current: 'recordings' }],
    'breadcrumbs.js'
  ),
  createMockConsoleLog(baseTime + 70600, 'info', ['Session refreshed successfully'], 'session.js'),
  createMockConsoleLog(
    baseTime + 72800,
    'error',
    ['QuotaExceededError: Failed to execute "setItem" on "Storage"'],
    'storage.js',
    ['at persistDraft (storage.js:58:18)', 'at onAutoSave (editor.js:210:7)']
  ),
  createMockConsoleLog(
    baseTime + 75000,
    'debug',
    ['Render cycle completed in 11ms'],
    'render-profiler.js'
  ),
  createMockConsoleLog(
    baseTime + 77200,
    'warning',
    ['Third-party script blocked by content security policy'],
    'csp.js'
  ),
  createMockConsoleLog(
    baseTime + 79400,
    'log',
    ['Executing cleanup routine before navigation'],
    'lifecycle.js'
  ),
  createMockConsoleLog(baseTime + 81600, 'info', ['Draft saved to remote backup'], 'backup.js'),
  createMockConsoleLog(
    baseTime + 83800,
    'error',
    ['DOMException: The operation is insecure'],
    'security.js',
    ['at requestClipboardPermission (security.js:14:10)', 'at onPaste (editor.js:131:13)']
  ),
  createMockConsoleLog(
    baseTime + 86000,
    'debug',
    ['Tab visibility changed: hidden -> visible'],
    'visibility.js'
  ),
  createMockConsoleLog(
    baseTime + 88200,
    'log',
    [{ experiment: 'search-v2', bucket: 'B', enabled: true }],
    'experiments.js'
  ),
  createMockConsoleLog(
    baseTime + 90000,
    'info',
    ['Console replay reached 90s mark'],
    'timeline.js'
  ),
];

const CONSOLE_FILTERS: { value: LogLevel; label: string; icon: LucideIcon; iconClass: string }[] = [
  { value: 'error', label: 'Error', icon: AlertCircle, iconClass: 'text-red-500' },
  { value: 'warning', label: 'Warning', icon: AlertTriangle, iconClass: 'text-yellow-500' },
  { value: 'info', label: 'Info', icon: Info, iconClass: 'text-blue-500' },
  { value: 'log', label: 'Log', icon: MessageSquare, iconClass: 'text-muted-foreground' },
  { value: 'debug', label: 'Debug', icon: Bug, iconClass: 'text-purple-500' },
];

export function ConsolePanel({
  data,
  isLoading,
  recordingStartTime: recordingStartTimeProp,
}: {
  data?: RecordingConsoleLog[];
  isLoading?: boolean;
  recordingStartTime?: number;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<LogLevel>>(
    new Set(['error', 'warning', 'info', 'log', 'debug'])
  );
  const [focusedEntryTs, setFocusedEntryTs] = useState<number | null>(null);

  const seekCtx = useRecordingPlayerSeek();
  const focusRequest = seekCtx?.focusRequest;
  const focusToken = focusRequest?.token;

  const toggleFilter = (level: LogLevel) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(level)) {
      newFilters.delete(level);
    } else {
      newFilters.add(level);
    }
    setActiveFilters(newFilters);
  };

  const isEmpty = data && data.length === 0;
  const logs = data ?? mockLogs;

  // Handle focus requests from the seek-bar marker click pipeline.
  // When a request targets a console entry: enable its level filter if needed,
  // clear search only if it would still hide the entry, then mark it focused.
  // Keyed on focusToken so repeat clicks on the same marker re-fire.
  const [prevFocusToken, setPrevFocusToken] = useState(focusToken);
  if (prevFocusToken !== focusToken) {
    setPrevFocusToken(focusToken);
    const target =
      focusRequest && focusRequest.kind === 'console'
        ? logs.find((l) => l.timestamp === focusRequest.entryTimestamp)
        : undefined;

    if (target) {
      setActiveFilters((prev) => {
        const level = target.type as LogLevel;
        if (prev.has(level)) return prev;
        const next = new Set(prev);
        next.add(level);
        return next;
      });

      const logText = target.args
        .map((arg) => formatSerializedValue(arg))
        .join(' ')
        .toLowerCase();
      setSearchQuery((prev) => (prev && !logText.includes(prev.toLowerCase()) ? '' : prev));

      setFocusedEntryTs(target.timestamp);
    }
  }

  // Clear the highlight a moment after it lands.
  useEffect(() => {
    if (focusedEntryTs === null) return;
    const t = setTimeout(() => setFocusedEntryTs(null), 1800);
    return () => clearTimeout(t);
  }, [focusedEntryTs]);

  const filteredLogs = logs.filter((log) => {
    const level = log.type as LogLevel;
    const matchesFilter = activeFilters.has(level);
    const logText = log.args.map((arg) => formatSerializedValue(arg)).join(' ');
    const matchesSearch = logText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const recordingStartTime =
    recordingStartTimeProp ?? (logs.length > 0 ? logs[0]?.timestamp : undefined);

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-3 space-y-3">
        <div className="flex items-center gap-2">
          <SearchInput
            placeholder="Filter"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {CONSOLE_FILTERS.map((filter) => {
                const Icon = filter.icon;
                return (
                  <DropdownMenuCheckboxItem
                    key={filter.value}
                    checked={activeFilters.has(filter.value)}
                    onCheckedChange={() => toggleFilter(filter.value)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${filter.iconClass}`} />
                      <span>{filter.label}</span>
                    </div>
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {CONSOLE_FILTERS.map((filter) => {
            const Icon = filter.icon;
            return (
              <Button
                key={filter.value}
                variant={activeFilters.has(filter.value) ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => toggleFilter(filter.value)}
                className="h-7 text-xs px-2 gap-1.5 shrink-0"
              >
                <Icon className={`h-3.5 w-3.5 ${filter.iconClass}`} />
                {filter.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 px-3 py-2 text-[10px] font-medium text-muted-foreground border-b bg-muted/30">
        <div className="w-12 shrink-0">Time</div>
        <div className="w-4 shrink-0" />
        <div className="flex-1">Log</div>
        <div className="w-28 text-right shrink-0">Source</div>
      </div>

      <div className="flex-1 overflow-y-auto font-mono">
        {isLoading ? (
          <ConsoleLogSkeleton />
        ) : isEmpty ? (
          <ConsolePanelEmptyState />
        ) : filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No logs match the current filters
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <ConsoleLogEntry
              key={`${log.timestamp}-${index}`}
              log={log}
              recordingStartTime={recordingStartTime}
              isFocused={focusedEntryTs === log.timestamp}
            />
          ))
        )}
      </div>
    </div>
  );
}

const SKELETON_LOG_WIDTHS = ['70%', '55%', '80%', '45%', '65%', '75%', '50%', '60%'];

function ConsoleLogSkeleton() {
  return (
    <div>
      {SKELETON_LOG_WIDTHS.map((width, i) => (
        <div
          key={`console-skel-${i}`}
          className="flex items-center gap-3 px-3 py-2 border-b border-border/40"
        >
          <Skeleton className="h-3 w-10 shrink-0" />
          <Skeleton className="h-3.5 w-3.5 shrink-0 rounded" />
          <div className="flex-1">
            <Skeleton className="h-3" style={{ width }} />
          </div>
          <Skeleton className="h-3 w-24 shrink-0" />
        </div>
      ))}
    </div>
  );
}
