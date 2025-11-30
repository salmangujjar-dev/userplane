'use client';

import { useState } from 'react';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Search, AlertCircle, AlertTriangle, Info, Bug, Skull } from 'lucide-react';
import { StructuredLog, LogLevel, createMockBackendLog } from './backend-log-types';
import { BackendLogEntry } from './backend-log-entry';

const baseTime = Date.now() - 60000;

const mockLogs: StructuredLog[] = [
  createMockBackendLog('1', baseTime, 'info', 'Server started successfully', {
    service: 'api',
    metadata: {
      port: 3000,
      env: 'production',
      nodeVersion: 'v20.10.0',
    },
  }),
  createMockBackendLog('2', baseTime + 1500, 'debug', 'Database connection established', {
    service: 'database',
    metadata: {
      host: 'db.example.com',
      database: 'users_prod',
      connectionTime: 45,
    },
  }),
  createMockBackendLog('3', baseTime + 3000, 'info', 'User authentication successful', {
    service: 'auth',
    metadata: {
      userId: 'user_123',
      method: 'jwt',
      ip: '192.168.1.100',
    },
    trace: {
      traceId: 'trace_abc123',
      spanId: 'span_def456',
    },
  }),
  createMockBackendLog('4', baseTime + 4500, 'warn', 'Rate limit approaching for user', {
    service: 'api',
    metadata: {
      userId: 'user_456',
      currentRequests: 95,
      limit: 100,
      window: '1 minute',
    },
  }),
  createMockBackendLog('5', baseTime + 6000, 'error', 'Failed to process payment', {
    service: 'payments',
    metadata: {
      orderId: 'order_789',
      amount: 99.99,
      currency: 'USD',
    },
    error: {
      type: 'PaymentProcessingError',
      message: 'Card declined: insufficient funds',
      stack:
        'PaymentProcessingError: Card declined\n    at processPayment (payment.js:45)\n    at handleOrder (order.js:123)\n    at processRequest (server.js:89)',
    },
    trace: {
      traceId: 'trace_xyz789',
      spanId: 'span_abc123',
      parentSpanId: 'span_parent_456',
    },
  }),
  createMockBackendLog('6', baseTime + 7500, 'debug', 'Cache hit for user profile', {
    service: 'cache',
    metadata: {
      key: 'user:123:profile',
      ttl: 3600,
      size: 2048,
    },
  }),
  createMockBackendLog('7', baseTime + 9000, 'info', 'Email sent successfully', {
    service: 'notifications',
    metadata: {
      to: 'user@example.com',
      template: 'order_confirmation',
      messageId: 'msg_abc456',
    },
  }),
  createMockBackendLog('8', baseTime + 10500, 'fatal', 'Critical database connection lost', {
    service: 'database',
    metadata: {
      host: 'db.example.com',
      lastPing: new Date(baseTime + 10490).toISOString(),
      reconnectAttempts: 3,
    },
    error: {
      type: 'ConnectionError',
      message: 'Connection to database lost after 3 retry attempts',
      stack:
        'ConnectionError: Connection lost\n    at checkConnection (db.js:234)\n    at healthCheck (monitor.js:67)\n    at interval (server.js:45)',
    },
  }),
];

export function BackendPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<LogLevel>>(
    new Set(['error', 'fatal', 'warn', 'info', 'debug'])
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
    const matchesFilter = activeFilters.has(log.level);
    const logText = [log.message, log.service, JSON.stringify(log.metadata)]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const matchesSearch = logText.includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const recordingStartTime = mockLogs.length > 0 ? mockLogs[0]?.timestamp : undefined;

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
            variant={activeFilters.has('fatal') ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => toggleFilter('fatal')}
            className="h-7 text-xs px-2"
          >
            <Skull className="h-3 w-3 text-red-700 dark:text-red-400" />
          </Button>
          <Button
            variant={activeFilters.has('error') ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => toggleFilter('error')}
            className="h-7 text-xs px-2"
          >
            <AlertCircle className="h-3 w-3 text-red-500" />
          </Button>
          <Button
            variant={activeFilters.has('warn') ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => toggleFilter('warn')}
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
          <BackendLogEntry key={log.id} log={log} recordingStartTime={recordingStartTime} />
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
