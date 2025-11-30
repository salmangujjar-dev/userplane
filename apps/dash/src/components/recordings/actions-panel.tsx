'use client';

import { useState } from 'react';
import { Input } from '@workspace/ui/components/input';
import { Search } from 'lucide-react';
import { ClickEvent, createMockClickEvent } from './action-types';
import { ActionEntry } from './action-entry';

const baseTime = Date.now() - 60000;

const mockClicks: ClickEvent[] = [
  createMockClickEvent(
    '1',
    baseTime,
    'div.container > button.submit',
    'BUTTON',
    { x: 245, y: 150 },
    {
      className: 'submit',
      textContent: 'Submit',
    }
  ),
  createMockClickEvent(
    '2',
    baseTime + 2500,
    'nav > a.link',
    'A',
    { x: 120, y: 45 },
    {
      className: 'link',
      textContent: 'Dashboard',
    }
  ),
  createMockClickEvent(
    '3',
    baseTime + 5000,
    'div.card > button.action',
    'BUTTON',
    { x: 380, y: 280 },
    {
      className: 'action',
      id: 'delete-btn',
      textContent: 'Delete',
    }
  ),
  createMockClickEvent(
    '4',
    baseTime + 8000,
    'input[type="checkbox"]',
    'INPUT',
    { x: 150, y: 200 },
    {
      className: 'checkbox',
      id: 'agree-terms',
    }
  ),
  createMockClickEvent(
    '5',
    baseTime + 12000,
    'div.modal > button.close',
    'BUTTON',
    { x: 500, y: 100 },
    {
      className: 'close',
      textContent: '×',
    }
  ),
  createMockClickEvent(
    '6',
    baseTime + 15000,
    'a.nav-item',
    'A',
    { x: 80, y: 60 },
    {
      className: 'nav-item',
      textContent: 'Settings',
    }
  ),
  createMockClickEvent(
    '7',
    baseTime + 18000,
    'button.primary',
    'BUTTON',
    { x: 300, y: 400 },
    {
      className: 'primary',
      id: 'save-btn',
      textContent: 'Save Changes',
    }
  ),
];

export function ActionsPanel() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClicks = mockClicks.filter((click) => {
    const searchText = [
      click.target.selector,
      click.target.tagName,
      click.target.className,
      click.target.id,
      click.target.textContent,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchText.includes(searchQuery.toLowerCase());
  });

  const recordingStartTime = mockClicks.length > 0 ? mockClicks[0].timestamp : undefined;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by element, class, id, or text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto font-mono">
        {filteredClicks.map((click) => (
          <ActionEntry key={click.id} click={click} recordingStartTime={recordingStartTime} />
        ))}
        {filteredClicks.length === 0 && (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No clicks match the current filter
          </div>
        )}
      </div>
    </div>
  );
}
