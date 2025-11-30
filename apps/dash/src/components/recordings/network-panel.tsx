'use client';

import { useState } from 'react';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Search } from 'lucide-react';
import {
  NetworkRequest,
  NetworkFilterType,
  getFilterTypeFromResourceType,
  createMockNetworkRequest,
} from './network-types';
import { NetworkEntry } from './network-entry';

const baseTime = Date.now() - 60000;

const mockRequests: NetworkRequest[] = [
  {
    ...createMockNetworkRequest(
      '1',
      'https://api.example.com/users?page=1&limit=10',
      'GET',
      'XHR',
      200,
      'OK',
      1024,
      125,
      baseTime
    ),
    request: {
      url: 'https://api.example.com/users?page=1&limit=10',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/json',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      initialPriority: 'High',
      referrerPolicy: 'strict-origin-when-cross-origin',
    },
    responseBody: JSON.stringify(
      {
        users: [
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
        ],
        total: 2,
      },
      null,
      2
    ),
  },
  createMockNetworkRequest(
    '2',
    'https://cdn.example.com/app.js',
    'GET',
    'Script',
    200,
    'OK',
    45678,
    234,
    baseTime + 500
  ),
  createMockNetworkRequest(
    '3',
    'https://cdn.example.com/styles.css',
    'GET',
    'Stylesheet',
    200,
    'OK',
    12345,
    89,
    baseTime + 800
  ),
  createMockNetworkRequest(
    '4',
    'https://cdn.example.com/logo.png',
    'GET',
    'Image',
    200,
    'OK',
    23456,
    156,
    baseTime + 1200
  ),
  createMockNetworkRequest(
    '5',
    'https://fonts.googleapis.com/css2?family=Inter',
    'GET',
    'Font',
    200,
    'OK',
    8765,
    67,
    baseTime + 1500
  ),
  {
    ...createMockNetworkRequest(
      '6',
      'https://api.example.com/data',
      'POST',
      'Fetch',
      201,
      'Created',
      512,
      345,
      baseTime + 2000
    ),
    request: {
      url: 'https://api.example.com/data',
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      postData: JSON.stringify(
        {
          name: 'New Item',
          description: 'This is a new data item',
          active: true,
        },
        null,
        2
      ),
      hasPostData: true,
      initialPriority: 'High',
      referrerPolicy: 'strict-origin-when-cross-origin',
    },
    responseBody: JSON.stringify(
      {
        success: true,
        message: 'Data created successfully',
        data: {
          id: 123,
          createdAt: new Date(baseTime + 2000).toISOString(),
        },
      },
      null,
      2
    ),
  },
  {
    ...createMockNetworkRequest(
      '7',
      'https://api.example.com/users/123',
      'PUT',
      'Fetch',
      200,
      'OK',
      512,
      189,
      baseTime + 2500
    ),
    request: {
      url: 'https://api.example.com/users/123',
      method: 'PUT',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      postData: JSON.stringify(
        {
          name: 'John Doe Updated',
          email: 'john.doe@example.com',
          role: 'admin',
        },
        null,
        2
      ),
      hasPostData: true,
      initialPriority: 'High',
      referrerPolicy: 'strict-origin-when-cross-origin',
    },
    responseBody: JSON.stringify(
      {
        success: true,
        message: 'User updated successfully',
        user: {
          id: 123,
          name: 'John Doe Updated',
          email: 'john.doe@example.com',
          role: 'admin',
          updatedAt: new Date(baseTime + 2500).toISOString(),
        },
      },
      null,
      2
    ),
  },
  createMockNetworkRequest(
    '8',
    'wss://ws.example.com/socket',
    'GET',
    'WebSocket',
    101,
    'Switching Protocols',
    0,
    12,
    baseTime + 3000
  ),
  {
    ...createMockNetworkRequest(
      '9',
      'https://api.example.com/analytics/track',
      'POST',
      'Fetch',
      204,
      'No Content',
      156,
      67,
      baseTime + 3500
    ),
    request: {
      url: 'https://api.example.com/analytics/track',
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: '*/*',
        'Content-Type': 'application/json',
      },
      postData: JSON.stringify(
        {
          event: 'page_view',
          properties: {
            page: '/dashboard',
            referrer: 'https://example.com',
            timestamp: new Date(baseTime + 3500).toISOString(),
          },
          user: {
            id: 'user_123',
            sessionId: 'sess_abc789',
          },
        },
        null,
        2
      ),
      hasPostData: true,
      initialPriority: 'Low',
      referrerPolicy: 'strict-origin-when-cross-origin',
    },
  },
];

export function NetworkPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<NetworkFilterType>('all');

  const filteredRequests = mockRequests.filter((request) => {
    const matchesSearch =
      request.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.method.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === 'all') return matchesSearch;

    const requestFilterType = getFilterTypeFromResourceType(request.type);
    return matchesSearch && requestFilterType === activeFilter;
  });

  const recordingStartTime = mockRequests.length > 0 ? mockRequests[0]?.timestamp : undefined;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by URL or method"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          <Button
            variant={activeFilter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('all')}
            className="h-7 text-xs px-3"
          >
            All
          </Button>
          <Button
            variant={activeFilter === 'fetch' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('fetch')}
            className="h-7 text-xs px-3"
          >
            Fetch/XHR
          </Button>
          <Button
            variant={activeFilter === 'ws' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('ws')}
            className="h-7 text-xs px-3"
          >
            WS
          </Button>
          <Button
            variant={activeFilter === 'js' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('js')}
            className="h-7 text-xs px-3"
          >
            JS
          </Button>
          <Button
            variant={activeFilter === 'css' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('css')}
            className="h-7 text-xs px-3"
          >
            CSS
          </Button>
          <Button
            variant={activeFilter === 'media' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('media')}
            className="h-7 text-xs px-3"
          >
            Media
          </Button>
          <Button
            variant={activeFilter === 'font' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('font')}
            className="h-7 text-xs px-3"
          >
            Font
          </Button>
          <Button
            variant={activeFilter === 'doc' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('doc')}
            className="h-7 text-xs px-3"
          >
            Doc
          </Button>
          <Button
            variant={activeFilter === 'other' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('other')}
            className="h-7 text-xs px-3"
          >
            Other
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 px-3 py-2 text-[10px] font-medium text-muted-foreground border-b bg-muted/30">
        <div className="w-12 shrink-0">Time</div>
        <div className="w-4 shrink-0" />
        <div className="flex-1">Name</div>
        <div className="w-12 text-center shrink-0">Status</div>
        <div className="w-20 text-right shrink-0">Time</div>
      </div>

      <div className="flex-1 overflow-y-auto font-mono">
        {filteredRequests.map((request) => (
          <NetworkEntry
            key={request.id}
            request={request}
            recordingStartTime={recordingStartTime}
          />
        ))}
        {filteredRequests.length === 0 && (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No network requests match the current filters
          </div>
        )}
      </div>
    </div>
  );
}
