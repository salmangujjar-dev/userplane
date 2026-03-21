import type { Decorator, Meta, StoryObj } from '@storybook/react';

import { createMockZAFClient } from '../../../../.storybook/mocks/zaf-client';
import { ZendeskApp } from '../../../app/zendesk/iframe/zendesk-app';

const iframeContainer: Decorator = (Story) => (
  <div
    style={{
      width: '330px',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      background: '#f8f9f9',
    }}
  >
    <Story />
  </div>
);

// Override ClientProvider to use mock client
const withMockClient: Decorator = (Story) => {
  const client = createMockZAFClient();
  // Inject ZAFClient into window for ClientProvider
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).ZAFClient = {
    init: () => client,
  };
  return <Story />;
};

const meta: Meta = {
  title: 'Zendesk/SetupScreen',
  decorators: [withMockClient, iframeContainer],
  parameters: {
    backgrounds: { default: 'zendesk' },
  },
};

export default meta;

type Story = StoryObj;

export const NeedsSetup: Story = {
  render: () => (
    <ZendeskApp
      config={null}
      subdomain="d3v-userplane"
      apiUrl="https://api-dev.userplane.io"
      dashboardUrl="https://dash-dev.userplane.io"
    />
  ),
};

export const Connected: Story = {
  render: () => (
    <ZendeskApp
      config={{ apiToken: 'mock-token', workspaceId: 'ws_mock123', subdomain: 'd3v-userplane' }}
      subdomain="d3v-userplane"
      apiUrl="https://api-dev.userplane.io"
      dashboardUrl="https://dash-dev.userplane.io"
    />
  ),
};
