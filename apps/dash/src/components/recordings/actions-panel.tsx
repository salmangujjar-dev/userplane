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
  ArrowRight,
  Eye,
  EyeOff,
  Filter,
  Globe,
  LogIn,
  LogOut,
  MousePointer2,
  Pause,
  Play,
} from 'lucide-react';
import { useState } from 'react';

import { ActionEntry } from './action-entry';
import type { RecordingActionLog, UserActionType } from './action-types';
import { createMockActionLog } from './action-types';

const baseTime = Date.now() - 60000;

const mockActions: RecordingActionLog[] = [
  createMockActionLog('1', baseTime, {
    action: 'init_page',
    url: 'https://app.example.com/dashboard',
    title: 'Dashboard',
  }),
  createMockActionLog('2', baseTime + 2500, {
    action: 'click',
    url: 'https://app.example.com/dashboard',
    info: { tagName: 'BUTTON', id: 'submit-btn', classList: ['submit', 'primary'] },
  }),
  createMockActionLog('3', baseTime + 5000, {
    action: 'click',
    url: 'https://app.example.com/dashboard',
    info: { tagName: 'A', id: '', classList: ['nav-link'] },
  }),
  createMockActionLog('4', baseTime + 7000, {
    action: 'spa_route',
    from: '/dashboard',
    to: '/settings',
    triggeredBy: 'pushState',
  }),
  createMockActionLog('5', baseTime + 9000, {
    action: 'click',
    url: 'https://app.example.com/settings',
    info: { tagName: 'INPUT', id: 'agree-terms', classList: ['checkbox'] },
  }),
  createMockActionLog('6', baseTime + 11000, {
    action: 'click',
    url: 'https://app.example.com/settings',
    info: { tagName: 'BUTTON', id: 'save-btn', classList: ['primary'] },
  }),
  createMockActionLog('7', baseTime + 14000, {
    action: 'tab_deactivated',
    tabId: 'tab-1',
  }),
  createMockActionLog('8', baseTime + 16000, {
    action: 'tab_activated',
    tabId: 'tab-1',
  }),
  createMockActionLog('9', baseTime + 18000, {
    action: 'navigate',
    from: 'https://app.example.com/settings',
    to: 'https://app.example.com/profile',
    method: 'pushState',
  }),
  createMockActionLog('10', baseTime + 20000, {
    action: 'click',
    url: 'https://app.example.com/profile',
    info: { tagName: 'BUTTON', id: 'delete-btn', classList: ['danger'] },
  }),
  createMockActionLog('11', baseTime + 23000, {
    action: 'click',
    url: 'https://app.example.com/profile',
    info: { tagName: 'BUTTON', id: 'confirm-delete', classList: ['danger', 'confirm'] },
  }),
  createMockActionLog('12', baseTime + 25000, {
    action: 'spa_route',
    from: '/profile',
    to: '/dashboard',
    triggeredBy: 'popState',
  }),
  createMockActionLog('13', baseTime + 28000, {
    action: 'tab_switch',
    from: 'tab-1',
    to: 'tab-2',
  }),
  createMockActionLog('14', baseTime + 32000, {
    action: 'click',
    url: 'https://app.example.com/dashboard',
    info: { tagName: 'BUTTON', id: 'theme-toggle', classList: ['toggle'] },
  }),
  createMockActionLog('15', baseTime + 35000, {
    action: 'page_unload',
    url: 'https://app.example.com/dashboard',
  }),
];

const ACTION_FILTERS: {
  value: UserActionType;
  label: string;
  icon: LucideIcon;
  iconClass: string;
}[] = [
  { value: 'click', label: 'Clicks', icon: MousePointer2, iconClass: 'text-blue-500' },
  { value: 'navigate', label: 'Navigation', icon: Globe, iconClass: 'text-green-500' },
  { value: 'spa_route', label: 'SPA Route', icon: ArrowRight, iconClass: 'text-purple-500' },
  { value: 'tab_activated', label: 'Tab Active', icon: Eye, iconClass: 'text-cyan-500' },
  { value: 'tab_deactivated', label: 'Tab Inactive', icon: EyeOff, iconClass: 'text-gray-500' },
  { value: 'tab_switch', label: 'Tab Switch', icon: ArrowRight, iconClass: 'text-orange-500' },
  { value: 'init_page', label: 'Page Init', icon: LogIn, iconClass: 'text-green-500' },
  { value: 'page_unload', label: 'Unload', icon: LogOut, iconClass: 'text-red-500' },
  { value: 'recorder-pause', label: 'Pause', icon: Pause, iconClass: 'text-yellow-500' },
  { value: 'recorder-resume', label: 'Resume', icon: Play, iconClass: 'text-green-500' },
];

const ALL_ACTION_TYPES = new Set<UserActionType>(ACTION_FILTERS.map((f) => f.value));

export function ActionsPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<UserActionType>>(
    new Set(ALL_ACTION_TYPES)
  );

  const toggleFilter = (action: UserActionType) => {
    const next = new Set(activeFilters);
    if (next.has(action)) {
      next.delete(action);
    } else {
      next.add(action);
    }
    setActiveFilters(next);
  };

  const filteredActions = mockActions.filter((action) => {
    if (activeFilters.size === 0) return false;
    const matchesFilter = activeFilters.has(action.data.action);

    const searchText = [
      action.data.action,
      action.data.url,
      action.data.from,
      action.data.to,
      action.data.info?.tagName,
      action.data.info?.id,
      action.data.info?.classList?.join(' '),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchesSearch = searchText.includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const recordingStartTime = mockActions.length > 0 ? mockActions[0]?.timestamp : undefined;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-3 space-y-3">
        <div className="flex items-center gap-2">
          <SearchInput
            placeholder="Filter by action, element, or URL"
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
              {ACTION_FILTERS.map((filter) => {
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
          {ACTION_FILTERS.map((filter) => {
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
        {filteredActions.map((action) => (
          <ActionEntry key={action.id} action={action} recordingStartTime={recordingStartTime} />
        ))}
        {filteredActions.length === 0 && (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No actions match the current filter
          </div>
        )}
      </div>
    </div>
  );
}
