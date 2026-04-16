'use client';

import { Button } from '@userplane/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@userplane/ui/components/dropdown-menu';
import { SearchInput } from '@userplane/ui/components/search-input';
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

import { ActionsPanelEmptyState } from '../shared/empty-state';
import { ActionEntry } from './action-entry';
import type { RecordingActionLog, UserActionType } from './action-types';
import { createMockActionLog } from './action-types';

const baseTime = Date.now() - 60000;

const mockActions: RecordingActionLog[] = [
  createMockActionLog(baseTime, {
    action: 'init_page',
    url: 'https://app.example.com/dashboard',
    title: 'Dashboard',
  }),
  createMockActionLog(baseTime + 800, {
    action: 'tab_activated',
    tabId: 'tab-1',
  }),
  createMockActionLog(baseTime + 1300, {
    action: 'recorder-pause',
  }),
  createMockActionLog(baseTime + 1700, {
    action: 'recorder-resume',
  }),
  createMockActionLog(baseTime + 2100, {
    action: 'tab_switch',
    from: 'tab-1',
    to: 'tab-2',
  }),
  createMockActionLog(baseTime + 2500, {
    action: 'click',
    url: 'https://app.example.com/dashboard',
    info: { tagName: 'BUTTON', id: 'submit-btn', classList: ['submit', 'primary'] },
  }),
  createMockActionLog(baseTime + 5000, {
    action: 'click',
    url: 'https://app.example.com/dashboard',
    info: { tagName: 'A', id: '', classList: ['nav-link'] },
  }),
  createMockActionLog(baseTime + 7000, {
    action: 'spa_route',
    from: '/dashboard',
    to: '/settings',
    triggeredBy: 'pushState',
  }),
  createMockActionLog(baseTime + 9000, {
    action: 'click',
    url: 'https://app.example.com/settings',
    info: { tagName: 'INPUT', id: 'agree-terms', classList: ['checkbox'] },
  }),
  createMockActionLog(baseTime + 11000, {
    action: 'click',
    url: 'https://app.example.com/settings',
    info: { tagName: 'BUTTON', id: 'save-btn', classList: ['primary'] },
  }),
  createMockActionLog(baseTime + 14000, {
    action: 'tab_deactivated',
    tabId: 'tab-1',
  }),
  createMockActionLog(baseTime + 16000, {
    action: 'tab_activated',
    tabId: 'tab-1',
  }),
  createMockActionLog(baseTime + 18000, {
    action: 'navigate',
    from: 'https://app.example.com/settings',
    to: 'https://app.example.com/profile',
    method: 'pushState',
  }),
  createMockActionLog(baseTime + 20000, {
    action: 'click',
    url: 'https://app.example.com/profile',
    info: { tagName: 'BUTTON', id: 'delete-btn', classList: ['danger'] },
  }),
  createMockActionLog(baseTime + 23000, {
    action: 'click',
    url: 'https://app.example.com/profile',
    info: { tagName: 'BUTTON', id: 'confirm-delete', classList: ['danger', 'confirm'] },
  }),
  createMockActionLog(baseTime + 25000, {
    action: 'spa_route',
    from: '/profile',
    to: '/dashboard',
    triggeredBy: 'popState',
  }),
  createMockActionLog(baseTime + 28000, {
    action: 'tab_switch',
    from: 'tab-1',
    to: 'tab-2',
  }),
  createMockActionLog(baseTime + 32000, {
    action: 'click',
    url: 'https://app.example.com/dashboard',
    info: { tagName: 'BUTTON', id: 'theme-toggle', classList: ['toggle'] },
  }),
  createMockActionLog(baseTime + 35000, {
    action: 'page_unload',
    url: 'https://app.example.com/dashboard',
  }),
  createMockActionLog(baseTime + 37200, {
    action: 'init_page',
    url: 'https://app.example.com/projects',
    title: 'Projects',
  }),
  createMockActionLog(baseTime + 39400, {
    action: 'click',
    url: 'https://app.example.com/projects',
    info: { tagName: 'INPUT', id: 'project-search', classList: ['search', 'input'] },
  }),
  createMockActionLog(baseTime + 41600, {
    action: 'click',
    url: 'https://app.example.com/projects',
    info: { tagName: 'BUTTON', id: 'open-project-alpha', classList: ['project-card', 'open'] },
  }),
  createMockActionLog(baseTime + 43800, {
    action: 'spa_route',
    from: '/projects',
    to: '/projects/alpha',
    triggeredBy: 'pushState',
  }),
  createMockActionLog(baseTime + 46000, {
    action: 'click',
    url: 'https://app.example.com/projects/alpha',
    info: { tagName: 'BUTTON', id: 'new-ticket', classList: ['primary', 'small'] },
  }),
  createMockActionLog(baseTime + 48200, {
    action: 'tab_switch',
    from: 'tab-2',
    to: 'tab-3',
  }),
  createMockActionLog(baseTime + 50400, {
    action: 'tab_deactivated',
    tabId: 'tab-3',
  }),
  createMockActionLog(baseTime + 52600, {
    action: 'tab_activated',
    tabId: 'tab-3',
  }),
  createMockActionLog(baseTime + 54800, {
    action: 'recorder-pause',
  }),
  createMockActionLog(baseTime + 57000, {
    action: 'recorder-resume',
  }),
  createMockActionLog(baseTime + 59200, {
    action: 'navigate',
    from: 'https://app.example.com/projects/alpha',
    to: 'https://app.example.com/projects/alpha/settings',
    method: 'pushState',
  }),
  createMockActionLog(baseTime + 61400, {
    action: 'click',
    url: 'https://app.example.com/projects/alpha/settings',
    info: { tagName: 'INPUT', id: 'notify-toggle', classList: ['switch'] },
  }),
  createMockActionLog(baseTime + 63600, {
    action: 'click',
    url: 'https://app.example.com/projects/alpha/settings',
    info: { tagName: 'BUTTON', id: 'save-settings', classList: ['primary'] },
  }),
  createMockActionLog(baseTime + 65800, {
    action: 'spa_route',
    from: '/projects/alpha/settings',
    to: '/projects/alpha/activity',
    triggeredBy: 'replaceState',
  }),
  createMockActionLog(baseTime + 68000, {
    action: 'click',
    url: 'https://app.example.com/projects/alpha/activity',
    info: { tagName: 'A', id: 'activity-item-42', classList: ['activity-link'] },
  }),
  createMockActionLog(baseTime + 70200, {
    action: 'navigate',
    from: 'https://app.example.com/projects/alpha/activity',
    to: 'https://app.example.com/help',
    method: 'link',
  }),
  createMockActionLog(baseTime + 72400, {
    action: 'click',
    url: 'https://app.example.com/help',
    info: { tagName: 'BUTTON', id: 'open-chat', classList: ['support', 'cta'] },
  }),
  createMockActionLog(baseTime + 74600, {
    action: 'tab_switch',
    from: 'tab-3',
    to: 'tab-1',
  }),
  createMockActionLog(baseTime + 76800, {
    action: 'spa_route',
    from: '/help',
    to: '/dashboard',
    triggeredBy: 'popState',
  }),
  createMockActionLog(baseTime + 79000, {
    action: 'click',
    url: 'https://app.example.com/dashboard',
    info: { tagName: 'BUTTON', id: 'refresh-metrics', classList: ['ghost'] },
  }),
  createMockActionLog(baseTime + 81200, {
    action: 'tab_deactivated',
    tabId: 'tab-1',
  }),
  createMockActionLog(baseTime + 83400, {
    action: 'tab_activated',
    tabId: 'tab-1',
  }),
  createMockActionLog(baseTime + 85600, {
    action: 'click',
    url: 'https://app.example.com/dashboard',
    info: { tagName: 'BUTTON', id: 'open-profile-menu', classList: ['avatar', 'menu-trigger'] },
  }),
  createMockActionLog(baseTime + 87800, {
    action: 'page_unload',
    url: 'https://app.example.com/dashboard',
  }),
  createMockActionLog(baseTime + 90000, {
    action: 'init_page',
    url: 'https://app.example.com/login',
    title: 'Sign In',
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

export function ActionsPanel({
  data,
  isLoading,
  recordingStartTime: recordingStartTimeProp,
}: {
  data?: RecordingActionLog[];
  isLoading?: boolean;
  recordingStartTime?: number;
}) {
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

  const isEmpty = data && data.length === 0;
  const actions = data ?? mockActions;

  const filteredActions = actions.filter((action) => {
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

  const recordingStartTime =
    recordingStartTimeProp ?? (actions.length > 0 ? actions[0]?.timestamp : undefined);

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
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            Loading user actions...
          </div>
        ) : isEmpty ? (
          <ActionsPanelEmptyState />
        ) : filteredActions.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No actions match the current filter
          </div>
        ) : (
          filteredActions.map((action, index) => (
            <ActionEntry
              key={`${action.timestamp}-${index}`}
              action={action}
              recordingStartTime={recordingStartTime}
            />
          ))
        )}
      </div>
    </div>
  );
}
