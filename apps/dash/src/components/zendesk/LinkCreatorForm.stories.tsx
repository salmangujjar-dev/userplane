import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { LinkCreatorForm } from './LinkCreatorForm';

const mockProjects = [
  { id: 'proj_1', name: 'Default Project' },
  { id: 'proj_2', name: 'Mobile App' },
  { id: 'proj_3', name: 'Marketing Site' },
];

const mockDomains = [
  { id: 'dom_1', url: 'example.com', verified: true },
  { id: 'dom_2', url: 'staging.example.com', verified: true },
];

const meta: Meta<typeof LinkCreatorForm> = {
  title: 'Zendesk/LinkCreatorForm',
  component: LinkCreatorForm,
  parameters: {
    backgrounds: { default: 'zendesk' },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: '330px',
          padding: '16px',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
        }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    onProjectChange: fn(),
    onDomainChange: fn(),
    onSubmit: fn(),
    onGoBack: fn(),
    workspaceId: 'ws_mock123',
  },
};

export default meta;

type Story = StoryObj<typeof LinkCreatorForm>;

export const Default: Story = {
  args: {
    projects: mockProjects,
    domains: mockDomains,
    selectedProject: 'proj_1',
    selectedDomain: 'dom_1',
    isCreating: false,
    isLoading: false,
  },
};

export const WithCustomMessage: Story = {
  args: {
    projects: mockProjects,
    domains: mockDomains,
    selectedProject: 'proj_1',
    selectedDomain: 'dom_1',
    isCreating: false,
    isLoading: false,
    customMessage: 'Please record your screen so we can help debug the issue.',
    onCustomMessageChange: fn(),
  },
};

export const Creating: Story = {
  args: {
    projects: mockProjects,
    domains: mockDomains,
    selectedProject: 'proj_1',
    selectedDomain: 'dom_1',
    isCreating: true,
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    projects: [],
    domains: [],
    selectedProject: '',
    selectedDomain: '',
    isCreating: false,
    isLoading: true,
  },
};

export const NoProjects: Story = {
  args: {
    projects: [],
    domains: [],
    selectedProject: '',
    selectedDomain: '',
    isCreating: false,
    isLoading: false,
  },
};

export const NoDomains: Story = {
  args: {
    projects: mockProjects,
    domains: [],
    selectedProject: 'proj_1',
    selectedDomain: '',
    isCreating: false,
    isLoading: false,
  },
};

export const WithoutGoBack: Story = {
  args: {
    projects: mockProjects,
    domains: mockDomains,
    selectedProject: 'proj_1',
    selectedDomain: 'dom_1',
    isCreating: false,
    isLoading: false,
    onGoBack: undefined,
  },
};
