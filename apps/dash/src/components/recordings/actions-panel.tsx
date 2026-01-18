'use client';

import { Input } from '@workspace/ui/components/input';
import { Search } from 'lucide-react';
import { useState } from 'react';

import { ActionEntry } from './action-entry';
import { ClickEvent, createMockClickEvent } from './action-types';

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
  createMockClickEvent(
    '8',
    baseTime + 20000,
    'div.dropdown > button',
    'BUTTON',
    { x: 200, y: 80 },
    {
      className: 'dropdown-toggle',
      textContent: 'Options',
    }
  ),
  createMockClickEvent(
    '9',
    baseTime + 22000,
    'ul.menu > li > a',
    'A',
    { x: 220, y: 120 },
    {
      className: 'menu-item',
      textContent: 'Export Data',
    }
  ),
  createMockClickEvent(
    '10',
    baseTime + 25000,
    'input[type="text"]',
    'INPUT',
    { x: 350, y: 180 },
    {
      className: 'search-input',
      id: 'search',
    }
  ),
  createMockClickEvent(
    '11',
    baseTime + 27000,
    'button.icon-btn',
    'BUTTON',
    { x: 450, y: 60 },
    {
      className: 'icon-btn',
      id: 'notifications',
    }
  ),
  createMockClickEvent(
    '12',
    baseTime + 30000,
    'div.card > a.link',
    'A',
    { x: 280, y: 320 },
    {
      className: 'link',
      textContent: 'View Details',
    }
  ),
  createMockClickEvent(
    '13',
    baseTime + 32000,
    'button.secondary',
    'BUTTON',
    { x: 180, y: 450 },
    {
      className: 'secondary',
      textContent: 'Cancel',
    }
  ),
  createMockClickEvent(
    '14',
    baseTime + 35000,
    'div.tabs > button',
    'BUTTON',
    { x: 160, y: 90 },
    {
      className: 'tab-button',
      textContent: 'Profile',
    }
  ),
  createMockClickEvent(
    '15',
    baseTime + 38000,
    'form > button[type="submit"]',
    'BUTTON',
    { x: 320, y: 480 },
    {
      className: 'submit-btn',
      textContent: 'Submit Form',
    }
  ),
  createMockClickEvent(
    '16',
    baseTime + 40000,
    'div.pagination > button',
    'BUTTON',
    { x: 400, y: 520 },
    {
      className: 'page-next',
      textContent: 'Next',
    }
  ),
  createMockClickEvent(
    '17',
    baseTime + 43000,
    'input[type="radio"]',
    'INPUT',
    { x: 170, y: 240 },
    {
      className: 'radio-option',
      id: 'option-2',
    }
  ),
  createMockClickEvent(
    '18',
    baseTime + 45000,
    'button.danger',
    'BUTTON',
    { x: 280, y: 380 },
    {
      className: 'danger',
      id: 'confirm-delete',
      textContent: 'Confirm Delete',
    }
  ),
  createMockClickEvent(
    '19',
    baseTime + 48000,
    'div.sidebar > a',
    'A',
    { x: 60, y: 140 },
    {
      className: 'sidebar-link',
      textContent: 'Analytics',
    }
  ),
  createMockClickEvent(
    '20',
    baseTime + 50000,
    'button.toggle',
    'BUTTON',
    { x: 420, y: 100 },
    {
      className: 'toggle',
      id: 'theme-toggle',
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

  const recordingStartTime = mockClicks.length > 0 ? mockClicks[0]?.timestamp : undefined;

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
