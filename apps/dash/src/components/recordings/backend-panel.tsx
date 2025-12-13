'use client';

import { useState } from 'react';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Search, AlertCircle, AlertTriangle, Info, Bug, Skull, Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
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
  createMockBackendLog('9', baseTime + 12000, 'info', 'Database connection restored', {
    service: 'database',
    metadata: {
      host: 'db.example.com',
      reconnectTime: 1500,
      connectionPool: 10,
    },
  }),
  createMockBackendLog('10', baseTime + 13500, 'debug', 'Query executed successfully', {
    service: 'database',
    metadata: {
      query: 'SELECT * FROM users WHERE active = true',
      executionTime: 45,
      rowsReturned: 1523,
    },
    trace: {
      traceId: 'trace_query_123',
      spanId: 'span_db_456',
    },
  }),
  createMockBackendLog('11', baseTime + 15000, 'warn', 'High memory usage detected', {
    service: 'api',
    metadata: {
      memoryUsed: '1.2 GB',
      memoryLimit: '1.5 GB',
      percentUsed: 80,
    },
  }),
  createMockBackendLog('12', baseTime + 16500, 'info', 'Background job completed', {
    service: 'worker',
    metadata: {
      jobId: 'job_789',
      jobType: 'data_sync',
      duration: 12345,
      itemsProcessed: 5000,
    },
    trace: {
      traceId: 'trace_worker_abc',
      spanId: 'span_job_def',
    },
  }),
  createMockBackendLog('13', baseTime + 18000, 'error', 'Failed to upload file to S3', {
    service: 'storage',
    metadata: {
      filename: 'user-avatar-123.jpg',
      size: 2048576,
      bucket: 'user-uploads',
    },
    error: {
      type: 'S3Error',
      message: 'Access denied: insufficient permissions',
      stack:
        'S3Error: Access denied\n    at uploadFile (s3.js:89)\n    at handleUpload (upload.js:45)\n    at processRequest (api.js:123)',
    },
    trace: {
      traceId: 'trace_upload_xyz',
      spanId: 'span_s3_789',
    },
  }),
  createMockBackendLog('14', baseTime + 19500, 'debug', 'Redis cache miss', {
    service: 'cache',
    metadata: {
      key: 'session:user_456',
      operation: 'GET',
      fallbackToDb: true,
    },
  }),
  createMockBackendLog('15', baseTime + 21000, 'info', 'Webhook delivered successfully', {
    service: 'webhooks',
    metadata: {
      webhookId: 'webhook_abc123',
      url: 'https://customer.example.com/webhook',
      event: 'order.completed',
      responseStatus: 200,
      deliveryTime: 234,
    },
    trace: {
      traceId: 'trace_webhook_123',
      spanId: 'span_delivery_456',
    },
  }),
  createMockBackendLog('16', baseTime + 22500, 'warn', 'API rate limit exceeded', {
    service: 'api',
    metadata: {
      endpoint: '/api/v1/data',
      clientIp: '203.0.113.45',
      requestCount: 1050,
      limit: 1000,
      windowSeconds: 60,
    },
  }),
  createMockBackendLog('17', baseTime + 24000, 'debug', 'JWT token validated', {
    service: 'auth',
    metadata: {
      userId: 'user_789',
      tokenAge: 3600,
      scopes: ['read', 'write'],
    },
    trace: {
      traceId: 'trace_auth_xyz',
      spanId: 'span_jwt_abc',
    },
  }),
  createMockBackendLog('18', baseTime + 25500, 'info', 'Scheduled maintenance completed', {
    service: 'maintenance',
    metadata: {
      taskType: 'index_optimization',
      tablesOptimized: 15,
      duration: 45678,
      spaceSaved: '2.3 GB',
    },
  }),
  createMockBackendLog('19', baseTime + 27000, 'error', 'Third-party API timeout', {
    service: 'integrations',
    metadata: {
      provider: 'payment-gateway',
      endpoint: 'https://api.payment-gateway.com/charge',
      timeout: 30000,
    },
    error: {
      type: 'TimeoutError',
      message: 'Request timeout after 30 seconds',
      stack:
        'TimeoutError: Request timeout\n    at makeRequest (http-client.js:156)\n    at chargeCard (payment.js:234)\n    at processOrder (order.js:78)',
    },
    trace: {
      traceId: 'trace_payment_timeout',
      spanId: 'span_gateway_call',
    },
  }),
  createMockBackendLog('20', baseTime + 28500, 'debug', 'Load balancer health check passed', {
    service: 'loadbalancer',
    metadata: {
      instanceId: 'i-0abc123def456',
      region: 'us-east-1',
      responseTime: 12,
    },
  }),
  createMockBackendLog('21', baseTime + 30000, 'info', 'Data export completed', {
    service: 'export',
    metadata: {
      exportId: 'export_xyz789',
      format: 'CSV',
      rowCount: 125000,
      fileSize: 45678901,
      duration: 23456,
    },
    trace: {
      traceId: 'trace_export_123',
      spanId: 'span_generation_456',
    },
  }),
  createMockBackendLog('22', baseTime + 31500, 'warn', 'Deprecated API version used', {
    service: 'api',
    metadata: {
      version: 'v1',
      endpoint: '/api/v1/legacy/data',
      clientUserAgent: 'OldClient/1.0',
      deprecationDate: '2024-12-31',
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
                checked={activeFilters.has('fatal')}
                onCheckedChange={() => toggleFilter('fatal')}
              >
                <div className="flex items-center gap-2">
                  <Skull className="h-4 w-4 text-red-700 dark:text-red-400" />
                  <span>Fatal</span>
                </div>
              </DropdownMenuCheckboxItem>
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
                checked={activeFilters.has('warn')}
                onCheckedChange={() => toggleFilter('warn')}
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
