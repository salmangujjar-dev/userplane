import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';

import { createMockZAFClient } from '../../../.storybook/mocks/zaf-client';
import { ErrorMessage } from '../components/ErrorMessage';
import { LinkCreatorForm } from '../components/LinkCreatorForm';
import { LinkSuccess } from '../components/LinkSuccess';
import { OpenerView } from '../components/OpenerView';
import { ClientContext } from '../contexts/ClientProvider';

const sampleProjects = [
  { id: 'proj_1', name: 'Marketing Site' },
  { id: 'proj_2', name: 'Mobile App' },
] as Array<{ id: string; name: string }>;

const sampleDomains = [
  { id: 'dom_1', url: 'app.example.com', verified: true },
  { id: 'dom_2', url: 'staging.example.com', verified: true },
] as Array<{ id: string; url: string; verified: boolean }>;

const sidebarContainer: Decorator = (Story) => (
  <div style={{ width: '330px', fontFamily: 'system-ui, sans-serif', fontSize: '14px' }}>
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
  title: 'Locations/TicketSidebar',
  decorators: [sidebarContainer, withMockClient],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj;

export const Opener: Story = {
  render: () => (
    <div style={{ padding: '16px' }}>
      <OpenerView
        onRequestRecording={() => console.log('Request recording')}
        onViewRecordings={() => console.log('View recordings')}
      />
    </div>
  ),
};

export const Creator: Story = {
  render: () => (
    <div style={{ padding: '16px' }}>
      <LinkCreatorForm
        projects={sampleProjects}
        domains={sampleDomains}
        selectedProject="proj_1"
        selectedDomain="dom_1"
        onProjectChange={() => {}}
        onDomainChange={() => {}}
        onSubmit={() => {}}
        onGoBack={() => console.log('Go back')}
        isCreating={false}
        isLoading={false}
        workspaceId="ws_mock123"
        customMessage="Test Agent has requested a screen recording from you"
        onCustomMessageChange={() => {}}
      />
    </div>
  ),
};

export const CreatorLoading: Story = {
  render: () => (
    <div style={{ padding: '16px' }}>
      <LinkCreatorForm
        projects={[]}
        domains={[]}
        selectedProject=""
        selectedDomain=""
        onProjectChange={() => {}}
        onDomainChange={() => {}}
        onSubmit={() => {}}
        onGoBack={() => console.log('Go back')}
        isCreating={false}
        isLoading={true}
        workspaceId="ws_mock123"
      />
    </div>
  ),
};

export const Success: Story = {
  render: () => (
    <div style={{ padding: '16px' }}>
      <LinkSuccess
        linkUrl="https://record.userplane.io/abc123"
        description="The link has been added to your reply draft."
        actions={[
          { label: 'Create another link', onClick: () => {}, variant: 'primary' },
          { label: 'Done', onClick: () => {}, variant: 'secondary' },
        ]}
      />
    </div>
  ),
};

export const Error: Story = {
  render: () => (
    <div style={{ padding: '16px' }}>
      <ErrorMessage
        message="An unexpected error occurred. Please try again."
        onRetry={() => console.log('Retry')}
        onGoBack={() => console.log('Go back')}
      />
    </div>
  ),
};
