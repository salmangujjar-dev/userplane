/**
 * App - Location router
 * Reads current Zendesk location from ZAF client context and renders the appropriate component
 */

import { useEffect, useState } from 'react';

import { initApiClient } from '@/api/client';

import { useClient } from './hooks/useClient';
import { TicketSidebar } from './locations/TicketSidebar';
import { TopBar } from './locations/TopBar';

export function App() {
  const client = useClient();
  const [location, setLocation] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        // Get app metadata (secure settings)
        const metadata = await client.metadata();
        const { apiToken, workspaceId: wsId } = metadata.settings;

        if (!apiToken || !wsId) {
          setError('Missing apiToken or workspaceId in app settings.');
          return;
        }

        // Initialize API client with the secure apiToken
        initApiClient(apiToken);
        setWorkspaceId(wsId);

        // Get current location
        const ctx = await client.context();
        setLocation(ctx.location);
      } catch {
        setError('Failed to initialize app.');
      }
    }

    init();
  }, [client]);

  if (error) {
    return <div style={{ padding: '16px', color: '#cc3340', fontSize: '13px' }}>{error}</div>;
  }

  if (!location || !workspaceId) {
    return <div style={{ padding: '16px', textAlign: 'center', color: '#68737d' }}>Loading...</div>;
  }

  switch (location) {
    case 'ticket_sidebar':
    case 'new_ticket_sidebar':
      return <TicketSidebar workspaceId={workspaceId} />;
    case 'top_bar':
      return <TopBar workspaceId={workspaceId} />;
    default:
      return (
        <div style={{ padding: '16px', color: '#68737d', fontSize: '13px' }}>
          Unsupported location: {location}
        </div>
      );
  }
}
