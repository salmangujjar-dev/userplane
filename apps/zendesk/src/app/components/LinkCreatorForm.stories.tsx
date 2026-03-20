import type { Meta, StoryObj } from '@storybook/react-vite';

import { LinkCreatorForm } from './LinkCreatorForm';

const meta: Meta<typeof LinkCreatorForm> = {
  title: 'Components/LinkCreatorForm',
  component: LinkCreatorForm,
};

export default meta;
type Story = StoryObj<typeof LinkCreatorForm>;

const sampleProjects = [
  { id: 'proj_1', name: 'Marketing Site' },
  { id: 'proj_2', name: 'Mobile App' },
] as Array<{ id: string; name: string }>;

const sampleDomains = [
  { id: 'dom_1', url: 'app.example.com', verified: true },
  { id: 'dom_2', url: 'staging.example.com', verified: true },
] as Array<{ id: string; url: string; verified: boolean }>;

export const Default: Story = {
  args: {
    projects: sampleProjects,
    domains: sampleDomains,
    selectedProject: 'proj_1',
    selectedDomain: 'dom_1',
    onProjectChange: () => {},
    onDomainChange: () => {},
    onSubmit: () => {},
    isCreating: false,
    isLoading: false,
    error: null,
    workspaceId: 'ws_123',
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
};

export const EmptyProjects: Story = {
  args: {
    ...Default.args,
    projects: [],
  },
};

export const Creating: Story = {
  args: {
    ...Default.args,
    isCreating: true,
  },
};

export const WithError: Story = {
  args: {
    ...Default.args,
    error: 'Recording limit exceeded. Upgrade your plan in the dashboard.',
  },
};
