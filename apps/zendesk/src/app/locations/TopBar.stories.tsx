import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';

import { createMockZAFClient } from '../../../.storybook/mocks/zaf-client';
import { ErrorMessage } from '../components/ErrorMessage';
import { LinkCreatorForm } from '../components/LinkCreatorForm';
import { LinkSuccess } from '../components/LinkSuccess';
import { ClientContext } from '../contexts/ClientProvider';

const sampleProjects = [
  { id: 'proj_1', name: 'Marketing Site' },
  { id: 'proj_2', name: 'Mobile App' },
] as Array<{ id: string; name: string }>;

const sampleDomains = [
  { id: 'dom_1', url: 'app.example.com', verified: true },
  { id: 'dom_2', url: 'staging.example.com', verified: true },
] as Array<{ id: string; url: string; verified: boolean }>;

const topBarContainer: Decorator = (Story) => (
  <div style={{ width: '380px', fontFamily: 'system-ui, sans-serif', fontSize: '14px' }}>
    <Story />
  </div>
);

const withMockClient: Decorator = (Story) => {
  const client = createMockZAFClient();
  return (
    <ClientContext.Provider value={client}>
      <Story />
    </ClientContext.Provider>
  );
};

const meta: Meta = {
  title: 'Locations/TopBar',
  decorators: [topBarContainer, withMockClient],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj;

export const Creator: Story = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <LinkCreatorForm
        projects={sampleProjects}
        domains={sampleDomains}
        selectedProject="proj_1"
        selectedDomain="dom_1"
        onProjectChange={() => {}}
        onDomainChange={() => {}}
        onSubmit={() => {}}
        isCreating={false}
        isLoading={false}
        workspaceId="ws_mock123"
      />
    </div>
  ),
};

export const Success: Story = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <LinkSuccess
        linkUrl="https://record.userplane.io/xyz789"
        description="Copy or share the recording link."
        actions={[
          { label: 'Create another', onClick: () => {}, variant: 'primary' },
          { label: 'Open in Dashboard', onClick: () => {}, variant: 'secondary' },
        ]}
      />
    </div>
  ),
};

export const Error: Story = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <ErrorMessage
        message="Failed to create link. Please try again."
        onRetry={() => console.log('Retry')}
        onGoBack={() => console.log('Go back')}
      />
    </div>
  ),
};
