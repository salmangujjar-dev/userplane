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
import {
  Cable,
  File,
  FileCode,
  FileJson,
  FileText,
  FileType,
  FileVideo,
  Filter,
  Globe,
} from 'lucide-react';
import { useState } from 'react';

import { NetworkPanelEmptyState } from '../shared/empty-state';
import { NetworkEntry } from './network-entry';
import type { RecordingNetworkLog } from './network-types';
import {
  createMockNetworkLog,
  getFilterTypeFromMimeAndInitiator,
  NetworkFilterType,
} from './network-types';

const baseTime = Date.now() - 60000;

const mockRequests: RecordingNetworkLog[] = [
  createMockNetworkLog(
    '1',
    'https://api.example.com/users?page=1&limit=10',
    'GET',
    'fetch',
    'application/json',
    200,
    'OK',
    125,
    baseTime,
    {
      requestHeaders: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/json',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
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
    }
  ),
  createMockNetworkLog(
    '2',
    'https://cdn.example.com/app.js',
    'GET',
    'script',
    'application/javascript',
    200,
    'OK',
    234,
    baseTime + 500,
    { isContentAllowed: false }
  ),
  createMockNetworkLog(
    '3',
    'https://cdn.example.com/styles.css',
    'GET',
    'link',
    'text/css',
    200,
    'OK',
    89,
    baseTime + 800,
    { isContentAllowed: false }
  ),
  createMockNetworkLog(
    '4',
    'https://cdn.example.com/logo.png',
    'GET',
    'img',
    'image/png',
    200,
    'OK',
    156,
    baseTime + 1200,
    { isContentAllowed: false }
  ),
  createMockNetworkLog(
    '5',
    'https://fonts.googleapis.com/css2?family=Inter',
    'GET',
    'link',
    'font/woff2',
    200,
    'OK',
    67,
    baseTime + 1500,
    { isContentAllowed: false }
  ),
  createMockNetworkLog(
    '6',
    'https://api.example.com/data',
    'POST',
    'fetch',
    'application/json',
    201,
    'Created',
    345,
    baseTime + 2000,
    {
      requestHeaders: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      requestBody: {
        type: 'json',
        body: { name: 'New Item', description: 'This is a new data item', active: true },
      },
      responseBody: JSON.stringify(
        {
          success: true,
          message: 'Data created successfully',
          data: { id: 123, createdAt: new Date(baseTime + 2000).toISOString() },
        },
        null,
        2
      ),
    }
  ),
  createMockNetworkLog(
    '7',
    'https://api.example.com/users/123',
    'PUT',
    'fetch',
    'application/json',
    200,
    'OK',
    189,
    baseTime + 2500,
    {
      requestHeaders: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      requestBody: {
        type: 'json',
        body: { name: 'John Doe Updated', email: 'john.doe@example.com', role: 'admin' },
      },
      responseBody: JSON.stringify(
        {
          success: true,
          user: {
            id: 123,
            name: 'John Doe Updated',
            email: 'john.doe@example.com',
            role: 'admin',
          },
        },
        null,
        2
      ),
    }
  ),
  createMockNetworkLog(
    '8',
    'wss://ws.example.com/socket',
    'GET',
    'websocket',
    '',
    101,
    'Switching Protocols',
    12,
    baseTime + 3000
  ),
  createMockNetworkLog(
    '9',
    'https://api.example.com/analytics/track',
    'POST',
    'fetch',
    'application/json',
    204,
    'No Content',
    67,
    baseTime + 3500,
    {
      requestHeaders: {
        'User-Agent': 'Mozilla/5.0',
        Accept: '*/*',
        'Content-Type': 'application/json',
      },
      requestBody: {
        type: 'json',
        body: {
          event: 'page_view',
          properties: { page: '/dashboard', referrer: 'https://example.com' },
          user: { id: 'user_123', sessionId: 'sess_abc789' },
        },
      },
    }
  ),
  createMockNetworkLog(
    '10',
    'https://cdn.example.com/avatar.jpg',
    'GET',
    'img',
    'image/jpeg',
    200,
    'OK',
    234,
    baseTime + 4000,
    { isContentAllowed: false }
  ),
  createMockNetworkLog(
    '11',
    'https://api.example.com/notifications',
    'GET',
    'fetch',
    'application/json',
    200,
    'OK',
    89,
    baseTime + 4500
  ),
  createMockNetworkLog(
    '12',
    'https://cdn.example.com/icons.svg',
    'GET',
    'img',
    'image/svg+xml',
    200,
    'OK',
    67,
    baseTime + 5000,
    { isContentAllowed: false }
  ),
  createMockNetworkLog(
    '13',
    'https://api.example.com/users/123/settings',
    'PATCH',
    'fetch',
    'application/json',
    200,
    'OK',
    156,
    baseTime + 5500,
    {
      requestHeaders: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      requestBody: {
        type: 'json',
        body: { theme: 'dark', notifications: true },
      },
    }
  ),
  createMockNetworkLog(
    '14',
    'https://fonts.googleapis.com/css2?family=Roboto',
    'GET',
    'link',
    'font/woff2',
    200,
    'OK',
    78,
    baseTime + 6000,
    { isContentAllowed: false }
  ),
  createMockNetworkLog(
    '15',
    'https://api.example.com/search?q=test',
    'GET',
    'fetch',
    'application/json',
    200,
    'OK',
    234,
    baseTime + 6500,
    {
      responseBody: JSON.stringify(
        {
          results: [
            { id: 1, title: 'Test Result 1', score: 0.95 },
            { id: 2, title: 'Test Result 2', score: 0.87 },
            { id: 3, title: 'Test Result 3', score: 0.72 },
          ],
          total: 3,
          page: 1,
        },
        null,
        2
      ),
    }
  ),
  createMockNetworkLog(
    '16',
    'https://cdn.example.com/banner.png',
    'GET',
    'img',
    'image/png',
    200,
    'OK',
    345,
    baseTime + 7000,
    { isContentAllowed: false }
  ),
  createMockNetworkLog(
    '17',
    'https://api.example.com/users/456',
    'DELETE',
    'fetch',
    'application/json',
    204,
    'No Content',
    123,
    baseTime + 7500,
    {
      requestHeaders: {
        'User-Agent': 'Mozilla/5.0',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    }
  ),
  createMockNetworkLog(
    '18',
    'https://cdn.example.com/video.mp4',
    'GET',
    'video',
    'video/mp4',
    206,
    'Partial Content',
    1234,
    baseTime + 8000,
    { isContentAllowed: false }
  ),
  createMockNetworkLog(
    '19',
    'https://api.example.com/health',
    'GET',
    'fetch',
    'application/json',
    200,
    'OK',
    45,
    baseTime + 8500
  ),
  createMockNetworkLog(
    '20',
    'https://api.example.com/upload',
    'POST',
    'fetch',
    'application/json',
    413,
    'Payload Too Large',
    234,
    baseTime + 9000,
    {
      requestHeaders: {
        'User-Agent': 'Mozilla/5.0',
        'Content-Type': 'multipart/form-data',
      },
    }
  ),
  createMockNetworkLog(
    '21',
    'https://cdn.example.com/chart.js',
    'GET',
    'script',
    'application/javascript',
    200,
    'OK',
    178,
    baseTime + 9500,
    { isContentAllowed: false }
  ),
  createMockNetworkLog(
    '22',
    'https://api.example.com/metrics',
    'GET',
    'fetch',
    'application/json',
    304,
    'Not Modified',
    23,
    baseTime + 10000
  ),
  createMockNetworkLog(
    '23',
    'https://cdn.example.com/background.jpg',
    'GET',
    'img',
    'image/jpeg',
    200,
    'OK',
    567,
    baseTime + 10500,
    { isContentAllowed: false }
  ),
  createMockNetworkLog(
    '24',
    'https://api.example.com/comments',
    'POST',
    'fetch',
    'application/json',
    201,
    'Created',
    234,
    baseTime + 11000,
    {
      requestHeaders: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      requestBody: {
        type: 'json',
        body: { postId: 42, text: 'Great article!', author: 'user_789' },
      },
    }
  ),
  createMockNetworkLog(
    '25',
    'https://api.example.com/timeout',
    'GET',
    'fetch',
    'application/json',
    408,
    'Request Timeout',
    30000,
    baseTime + 41000
  ),
];

const NETWORK_FILTERS: {
  value: Exclude<NetworkFilterType, 'all'>;
  label: string;
  icon: LucideIcon;
  iconClass: string;
}[] = [
  { value: 'fetch', label: 'Fetch/XHR', icon: Globe, iconClass: 'text-orange-500' },
  { value: 'ws', label: 'WS', icon: Cable, iconClass: 'text-cyan-500' },
  { value: 'js', label: 'JS', icon: FileCode, iconClass: 'text-yellow-500' },
  { value: 'css', label: 'CSS', icon: FileText, iconClass: 'text-blue-500' },
  { value: 'media', label: 'Media', icon: FileVideo, iconClass: 'text-pink-500' },
  { value: 'font', label: 'Font', icon: FileType, iconClass: 'text-green-500' },
  { value: 'doc', label: 'Doc', icon: FileJson, iconClass: 'text-red-500' },
  { value: 'other', label: 'Other', icon: File, iconClass: 'text-muted-foreground' },
];

const ALL_NETWORK_TYPES = new Set<Exclude<NetworkFilterType, 'all'>>(
  NETWORK_FILTERS.map((f) => f.value)
);

export function NetworkPanel({
  data,
  isLoading,
}: {
  data?: RecordingNetworkLog[];
  isLoading?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<Exclude<NetworkFilterType, 'all'>>>(
    new Set(ALL_NETWORK_TYPES)
  );

  const toggleFilter = (filter: Exclude<NetworkFilterType, 'all'>) => {
    const next = new Set(activeFilters);
    if (next.has(filter)) {
      next.delete(filter);
    } else {
      next.add(filter);
    }
    setActiveFilters(next);
  };

  const isEmpty = data && data.length === 0;
  const requests = data ?? mockRequests;

  const filteredRequests = requests.filter((request) => {
    if (activeFilters.size === 0) return false;

    const matchesSearch =
      request.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.method.toLowerCase().includes(searchQuery.toLowerCase());

    const requestFilterType = getFilterTypeFromMimeAndInitiator(request.type, request.mimeType);
    return matchesSearch && activeFilters.has(requestFilterType);
  });

  const recordingStartTime = requests.length > 0 ? requests[0]?.timestamp : undefined;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-3 space-y-3">
        <div className="flex items-center gap-2">
          <SearchInput
            placeholder="Filter by URL or method"
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
              {NETWORK_FILTERS.map((filter) => {
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
          {NETWORK_FILTERS.map((filter) => {
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
        <div className="flex-1">Name</div>
        <div className="w-12 text-center shrink-0">Status</div>
        <div className="w-20 text-right shrink-0">Duration</div>
      </div>

      <div className="flex-1 overflow-y-auto font-mono">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            Loading network activity...
          </div>
        ) : isEmpty ? (
          <NetworkPanelEmptyState />
        ) : filteredRequests.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No network requests match the current filters
          </div>
        ) : (
          filteredRequests.map((request, index) => (
            <NetworkEntry
              key={`${request.id}-${index}`}
              request={request}
              recordingStartTime={recordingStartTime}
            />
          ))
        )}
      </div>
    </div>
  );
}
