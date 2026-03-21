import type { Decorator, Meta, StoryObj } from '@storybook/react';

import { createMockZAFClient } from '../../../../.storybook/mocks/zaf-client';
import { initZendeskApiClient } from '../../../lib/zendesk/api-client';
import { ClientContext } from '../ClientProvider';
import { TicketSidebar } from '../TicketSidebar';

// Initialize a mock API client for stories
initZendeskApiClient('mock-token', 'https://api-dev.userplane.io');

// Mock fetch for API calls
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input.toString();

  if (url.includes('/zendesk/projects')) {
    return Response.json({
      success: true,
      data: {
        projects: [
          { id: 'proj_1', name: 'Default Project' },
          { id: 'proj_2', name: 'Mobile App' },
        ],
      },
    });
  }
  if (url.includes('/zendesk/domains')) {
    return Response.json({
      success: true,
      data: { domains: [{ id: 'dom_1', url: 'example.com', verified: true }] },
    });
  }
  if (url.includes('/zendesk/links')) {
    return Response.json({
      success: true,
      data: { linkId: 'link_mock', linkUrl: 'https://rec.userplane.io/abc123' },
    });
  }

  return originalFetch(input, init);
};

const sidebarContainer: Decorator = (Story) => (
  <div
    style={{
      width: '330px',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      background: '#f8f9f9',
      minHeight: '400px',
    }}
  >
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

const meta: Meta<typeof TicketSidebar> = {
  title: 'Zendesk/TicketSidebar',
  component: TicketSidebar,
  decorators: [withMockClient, sidebarContainer],
  parameters: {
    backgrounds: { default: 'zendesk' },
  },
};

export default meta;

type Story = StoryObj<typeof TicketSidebar>;

export const Default: Story = {
  args: {
    workspaceId: 'ws_mock123',
    dashboardUrl: 'https://dash-dev.userplane.io',
  },
};
