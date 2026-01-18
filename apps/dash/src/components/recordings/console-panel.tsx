'use client';

import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Input } from '@workspace/ui/components/input';
import { AlertCircle, AlertTriangle, Bug, Filter, Info, MessageSquare, Search } from 'lucide-react';
import { useState } from 'react';

import { ConsoleLogEntry } from './console-log-entry';
import {
  ConsoleLogEvent,
  createMockLogEvent,
  formatTimestamp,
  LogLevel,
} from './console-log-types';

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
  createMockLogEvent('7', baseTime + 7998, 'info', 'API response received in 234ms', {
    url: 'api-client.js',
    lineNumber: 178,
  }),
  createMockLogEvent('8', baseTime + 9331, 'warning', 'Memory usage high: 85% of heap', {
    url: 'monitor.js',
    lineNumber: 45,
  }),
  {
    id: '9',
    timestamp: formatTimestamp(baseTime + 10664),
    event: {
      type: 'error',
      args: [{ type: 'string', value: 'TypeError: Cannot read property "map" of undefined' }],
      executionContextId: 1,
      timestamp: baseTime + 10664,
      stackTrace: {
        callFrames: [
          {
            functionName: 'renderList',
            scriptId: '2',
            url: 'list-view.js',
            lineNumber: 234,
            columnNumber: 16,
          },
          {
            functionName: 'render',
            scriptId: '2',
            url: 'component.js',
            lineNumber: 67,
            columnNumber: 8,
          },
        ],
      },
    },
  },
  createMockLogEvent('10', baseTime + 11997, 'log', 'Fetching user preferences', {
    url: 'settings.js',
    lineNumber: 56,
  }),
  createMockLogEvent('11', baseTime + 13330, 'debug', 'WebSocket connection established', {
    url: 'websocket.js',
    lineNumber: 123,
  }),
  createMockLogEvent('12', baseTime + 14663, 'info', 'Theme changed to dark mode', {
    url: 'theme.js',
    lineNumber: 89,
  }),
  createMockLogEvent('13', baseTime + 15996, 'warning', 'Slow network detected: 2G', {
    url: 'network-monitor.js',
    lineNumber: 34,
  }),
  {
    id: '14',
    timestamp: formatTimestamp(baseTime + 17329),
    event: {
      type: 'log',
      args: [
        {
          type: 'object',
          preview: {
            type: 'object',
            overflow: false,
            properties: [
              { name: 'status', type: 'string', value: 'success' },
              { name: 'items', type: 'number', value: '42' },
              { name: 'hasMore', type: 'boolean', value: 'true' },
            ],
          },
          description: '{status: "success", items: 42, hasMore: true}',
        },
      ],
      executionContextId: 1,
      timestamp: baseTime + 17329,
      stackTrace: {
        callFrames: [
          {
            functionName: '',
            scriptId: '3',
            url: 'pagination.js',
            lineNumber: 145,
            columnNumber: 0,
          },
        ],
      },
    },
  },
  createMockLogEvent('15', baseTime + 18662, 'debug', 'Redux store updated', {
    url: 'store.js',
    lineNumber: 78,
  }),
  createMockLogEvent('16', baseTime + 19995, 'error', 'Failed to save to localStorage', {
    url: 'storage.js',
    lineNumber: 23,
  }),
  createMockLogEvent('17', baseTime + 21328, 'info', 'Form validation passed', {
    url: 'form-validator.js',
    lineNumber: 156,
  }),
  createMockLogEvent('18', baseTime + 22661, 'log', 'Animation completed', {
    url: 'animations.js',
    lineNumber: 234,
  }),
  createMockLogEvent('19', baseTime + 23994, 'warning', 'Image failed to load: avatar.png', {
    url: 'image-loader.js',
    lineNumber: 67,
  }),
  createMockLogEvent('20', baseTime + 25327, 'debug', 'Cache cleared for user session', {
    url: 'cache.js',
    lineNumber: 89,
  }),
  {
    id: '21',
    timestamp: formatTimestamp(baseTime + 26660),
    event: {
      type: 'error',
      args: [{ type: 'string', value: 'Network request failed: 500 Internal Server Error' }],
      executionContextId: 1,
      timestamp: baseTime + 26660,
      stackTrace: {
        callFrames: [
          {
            functionName: 'handleError',
            scriptId: '4',
            url: 'error-handler.js',
            lineNumber: 123,
            columnNumber: 24,
          },
          {
            functionName: 'fetch',
            scriptId: '4',
            url: 'api.js',
            lineNumber: 45,
            columnNumber: 12,
          },
        ],
      },
    },
  },
  createMockLogEvent('22', baseTime + 27993, 'info', 'User logged out successfully', {
    url: 'auth.js',
    lineNumber: 234,
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

  const recordingStartTime = mockLogs.length > 0 ? mockLogs[0]?.event.timestamp : undefined;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuCheckboxItem
                checked={activeFilters.has('error')}
                onCheckedChange={() => toggleFilter('error')}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span>Error</span>
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilters.has('warning')}
                onCheckedChange={() => toggleFilter('warning')}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span>Warning</span>
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilters.has('info')}
                onCheckedChange={() => toggleFilter('info')}
              >
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span>Info</span>
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilters.has('log')}
                onCheckedChange={() => toggleFilter('log')}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Log</span>
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilters.has('debug')}
                onCheckedChange={() => toggleFilter('debug')}
              >
                <div className="flex items-center gap-2">
                  <Bug className="h-4 w-4 text-purple-500" />
                  <span>Debug</span>
                </div>
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
