'use client';

import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { SearchInput } from '@workspace/ui/components/search-input';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, AlertTriangle, Bug, Filter, Info, MessageSquare } from 'lucide-react';
import { useState } from 'react';

import { ConsolePanelEmptyState } from '../shared/empty-state';
import { ConsoleLogEntry } from './console-log-entry';
import type { RecordingConsoleLog } from './console-log-types';
import { createMockConsoleLog, LogLevel } from './console-log-types';
import { formatSerializedValue } from './console-log-types';

const baseTime = Date.now() - 60000;

const mockLogs: RecordingConsoleLog[] = [
  createMockConsoleLog('1', baseTime, 'log', ['Application started'], 'app.js'),
  createMockConsoleLog('2', baseTime + 1333, 'info', ['User authentication successful'], 'auth.js'),
  createMockConsoleLog(
    '3',
    baseTime + 2666,
    'warning',
    ['Deprecated API usage detected'],
    'api.js'
  ),
  createMockConsoleLog(
    '4',
    baseTime + 3999,
    'error',
    ['Failed to load resource: net::ERR_CONNECTION_REFUSED'],
    'api.js',
    ['at fetchData (api.js:45:12)', 'at loadUser (user.js:23:8)', 'at init (app.js:12:4)']
  ),
  createMockConsoleLog(
    '5',
    baseTime + 5332,
    'log',
    [{ user: 'john', id: 123, active: true }],
    'data.js'
  ),
  createMockConsoleLog(
    '6',
    baseTime + 6665,
    'debug',
    ['Component mounted: UserProfile'],
    'components.js'
  ),
  createMockConsoleLog(
    '7',
    baseTime + 7998,
    'info',
    ['API response received in 234ms'],
    'api-client.js'
  ),
  createMockConsoleLog(
    '8',
    baseTime + 9331,
    'warning',
    ['Memory usage high: 85% of heap'],
    'monitor.js'
  ),
  createMockConsoleLog(
    '9',
    baseTime + 10664,
    'error',
    ['TypeError: Cannot read property "map" of undefined'],
    'list-view.js',
    ['at renderList (list-view.js:234:16)', 'at render (component.js:67:8)']
  ),
  createMockConsoleLog('10', baseTime + 11997, 'log', ['Fetching user preferences'], 'settings.js'),
  createMockConsoleLog(
    '11',
    baseTime + 13330,
    'debug',
    ['WebSocket connection established'],
    'websocket.js'
  ),
  createMockConsoleLog('12', baseTime + 14663, 'info', ['Theme changed to dark mode'], 'theme.js'),
  createMockConsoleLog(
    '13',
    baseTime + 15996,
    'warning',
    ['Slow network detected: 2G'],
    'network-monitor.js'
  ),
  createMockConsoleLog(
    '14',
    baseTime + 17329,
    'log',
    [{ status: 'success', items: 42, hasMore: true }],
    'pagination.js'
  ),
  createMockConsoleLog('15', baseTime + 18662, 'debug', ['Redux store updated'], 'store.js'),
  createMockConsoleLog(
    '16',
    baseTime + 19995,
    'error',
    ['Failed to save to localStorage'],
    'storage.js'
  ),
  createMockConsoleLog(
    '17',
    baseTime + 21328,
    'info',
    ['Form validation passed'],
    'form-validator.js'
  ),
  createMockConsoleLog('18', baseTime + 22661, 'log', ['Animation completed'], 'animations.js'),
  createMockConsoleLog(
    '19',
    baseTime + 23994,
    'warning',
    ['Image failed to load: avatar.png'],
    'image-loader.js'
  ),
  createMockConsoleLog(
    '20',
    baseTime + 25327,
    'debug',
    ['Cache cleared for user session'],
    'cache.js'
  ),
  createMockConsoleLog(
    '21',
    baseTime + 26660,
    'error',
    ['Network request failed: 500 Internal Server Error'],
    'error-handler.js',
    ['at handleError (error-handler.js:123:24)', 'at fetch (api.js:45:12)']
  ),
  createMockConsoleLog('22', baseTime + 27993, 'info', ['User logged out successfully'], 'auth.js'),
  createMockConsoleLog(
    '23',
    baseTime + 29000,
    'log',
    [
      'User data:',
      { type: 'element', tag: 'div', id: 'root', class: 'app-container' } as unknown as string,
    ],
    'debug.js'
  ),
  createMockConsoleLog(
    '24',
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
  createMockConsoleLog('25', baseTime + 31000, 'log', [[1, 2, 3, 4, 5]], 'data.js'),
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
}: {
  data?: RecordingConsoleLog[];
  isLoading?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<LogLevel>>(
    new Set(['error', 'warning', 'info', 'log', 'debug'])
  );

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

  const filteredLogs = logs.filter((log) => {
    const level = log.type as LogLevel;
    const matchesFilter = activeFilters.has(level);
    const logText = log.args.map((arg) => formatSerializedValue(arg)).join(' ');
    const matchesSearch = logText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const recordingStartTime = logs.length > 0 ? logs[0]?.timestamp : undefined;

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

      <div className="flex-1 overflow-y-auto font-mono">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            Loading console logs...
          </div>
        ) : isEmpty ? (
          <ConsolePanelEmptyState />
        ) : filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No logs match the current filters
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <ConsoleLogEntry
              key={`${log.id}-${index}`}
              log={log}
              recordingStartTime={recordingStartTime}
            />
          ))
        )}
      </div>
    </div>
  );
}
