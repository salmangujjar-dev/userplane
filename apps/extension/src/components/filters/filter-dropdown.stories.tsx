import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { FolderKanban, Globe, Link2, Users } from 'lucide-react';
import { useState } from 'react';

import { FilterDropdown, type FilterOption } from './filter-dropdown';

const sampleProjects: FilterOption[] = [
  { value: 'proj-1', label: 'Marketing Website' },
  { value: 'proj-2', label: 'Mobile App' },
  { value: 'proj-3', label: 'API Platform' },
  { value: 'proj-4', label: 'Design System' },
  { value: 'proj-5', label: 'Analytics Dashboard' },
];

const sampleMembers: FilterOption[] = [
  { value: 'mem-1', label: 'Alice Johnson', avatar: true },
  { value: 'mem-2', label: 'Bob Smith', avatar: true },
  { value: 'mem-3', label: 'Charlie Brown', avatar: true },
  { value: 'mem-4', label: 'Diana Prince', avatar: true },
];

const sampleDomains: FilterOption[] = [
  { value: 'dom-1', label: 'app.example.com' },
  { value: 'dom-2', label: 'staging.example.com' },
  { value: 'dom-3', label: 'links.mycompany.io' },
];

const meta = {
  title: 'Filters/FilterDropdown',
  component: FilterDropdown,
  args: {
    label: 'Projects',
    options: sampleProjects,
    selected: [],
    onSelectionChange: fn(),
    icon: FolderKanban,
    placeholder: 'Search projects...',
  },
} satisfies Meta<typeof FilterDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPreselected: Story = {
  args: {
    selected: ['proj-1'],
  },
};

export const MultipleSelected: Story = {
  args: {
    selected: ['proj-1', 'proj-3'],
  },
};

export const MemberFilter: Story = {
  args: {
    label: 'Member',
    options: sampleMembers,
    icon: Users,
    placeholder: 'Search members...',
    showAvatars: true,
    selected: [],
  },
};

export const MemberFilterWithSelection: Story = {
  args: {
    label: 'Member',
    options: sampleMembers,
    icon: Users,
    placeholder: 'Search members...',
    showAvatars: true,
    selected: ['mem-1', 'mem-2'],
  },
};

export const DomainFilter: Story = {
  args: {
    label: 'Domain',
    options: sampleDomains,
    icon: Globe,
    placeholder: 'Search domains...',
    showTooltip: true,
    selected: [],
  },
};

export const SingleSelect: Story = {
  args: {
    label: 'Link',
    options: [
      { value: 'link-1', label: 'Bug Report Form' },
      { value: 'link-2', label: 'Feature Request' },
      { value: 'link-3', label: 'Support Ticket' },
    ],
    icon: Link2,
    singleSelect: true,
    selected: [],
  },
};

export const EmptyOptions: Story = {
  args: {
    label: 'Projects',
    options: [],
    selected: [],
  },
};

export const Searching: Story = {
  args: {
    label: 'Projects',
    options: [],
    selected: [],
    isSearching: true,
  },
};

export const Interactive: Story = {
  render: () => {
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <div className="flex items-center gap-2">
        <FilterDropdown
          label="Projects"
          icon={FolderKanban}
          options={sampleProjects}
          selected={selected}
          onSelectionChange={setSelected}
          placeholder="Search projects..."
        />
        <FilterDropdown
          label="Member"
          icon={Users}
          options={sampleMembers}
          selected={[]}
          onSelectionChange={() => {}}
          placeholder="Search members..."
          showAvatars
        />
        <FilterDropdown
          label="Domain"
          icon={Globe}
          options={sampleDomains}
          selected={[]}
          onSelectionChange={() => {}}
          placeholder="Search domains..."
          showTooltip
        />
      </div>
    );
  },
};
