'use client';

import { useState } from 'react';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Search, AlertCircle, AlertTriangle, Info, MessageSquare, Bug } from 'lucide-react';
import {
  ConsoleLogEvent,
  LogLevel,
  createMockLogEvent,
  formatTimestamp,
} from './console-log-types';
import { ConsoleLogEntry } from './console-log-entry';

const baseTime = Date.now() - 60000;

const mockLogs: ConsoleLogEvent[] = [
  createMockLogEvent('1', baseTime, 'log', 'Application started', {
    url: 'app.js',
    lineNumber: 42,
  }),
  createMockLogEvent('2', baseTime + 1333, 'info', 'User authentication successful', {
    url: 'auth.js',
    lineNumber: 156,
  }),
  createMockLogEvent('3', baseTime + 2666, 'warning', 'Deprecated API usage detected', {
    url: 'api.js',
    lineNumber: 89,
  }),
  {
    id: '4',
    timestamp: formatTimestamp(baseTime + 3999),
    event: {
      type: 'error',
      args: [{ type: 'string', value: 'Failed to load resource: net::ERR_CONNECTION_REFUSED' }],
      executionContextId: 1,
      timestamp: baseTime + 3999,
      stackTrace: {
        callFrames: [
          {
            functionName: 'fetchData',
            scriptId: '1',
            url: 'api.js',
            lineNumber: 45,
            columnNumber: 12,
          },
          {
            functionName: 'loadUser',
            scriptId: '1',
            url: 'user.js',
            lineNumber: 23,
            columnNumber: 8,
          },
          { functionName: 'init', scriptId: '1', url: 'app.js', lineNumber: 12, columnNumber: 4 },
        ],
      },
    },
  },
  {
    id: '5',
    timestamp: formatTimestamp(baseTime + 5332),
    event: {
      type: 'log',
      args: [
        {
          type: 'object',
          preview: {
            type: 'object',
            overflow: false,
            properties: [
              { name: 'user', type: 'string', value: 'john' },
              { name: 'id', type: 'number', value: '123' },
              { name: 'active', type: 'boolean', value: 'true' },
            ],
          },
          description: '{user: "john", id: 123, active: true}',
        },
      ],
      executionContextId: 1,
      timestamp: baseTime + 5332,
      stackTrace: {
        callFrames: [
          { functionName: '', scriptId: '1', url: 'data.js', lineNumber: 67, columnNumber: 0 },
        ],
      },
    },
  },
  createMockLogEvent('6', baseTime + 6665, 'debug', 'Component mounted: UserProfile', {
    url: 'components.js',
    lineNumber: 89,
  }),
];

export function ConsolePanel() {
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

  const filteredLogs = mockLogs.filter((log) => {
    const level = log.event.type as LogLevel;
    const matchesFilter = activeFilters.has(level);
    const logText = log.event.args
      .map((arg) => String(arg.value || arg.description || ''))
      .join(' ');
    const matchesSearch = logText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const recordingStartTime = mockLogs.length > 0 ? mockLogs[0].event.timestamp : undefined;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          <Button
            variant={activeFilters.has('error') ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => toggleFilter('error')}
            className="h-7 text-xs px-2"
          >
            <AlertCircle className="h-3 w-3 text-red-500" />
          </Button>
          <Button
            variant={activeFilters.has('warning') ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => toggleFilter('warning')}
            className="h-7 text-xs px-2"
          >
            <AlertTriangle className="h-3 w-3 text-yellow-500" />
          </Button>
          <Button
            variant={activeFilters.has('info') ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => toggleFilter('info')}
            className="h-7 text-xs px-2"
          >
            <Info className="h-3 w-3 text-blue-500" />
          </Button>
          <Button
            variant={activeFilters.has('log') ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => toggleFilter('log')}
            className="h-7 text-xs px-2"
          >
            <MessageSquare className="h-3 w-3" />
          </Button>
          <Button
            variant={activeFilters.has('debug') ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => toggleFilter('debug')}
            className="h-7 text-xs px-2"
          >
            <Bug className="h-3 w-3 text-purple-500" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto font-mono">
        {filteredLogs.map((log) => (
          <ConsoleLogEntry key={log.id} log={log} recordingStartTime={recordingStartTime} />
        ))}
        {filteredLogs.length === 0 && (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No logs match the current filters
          </div>
        )}
      </div>
    </div>
  );
}
