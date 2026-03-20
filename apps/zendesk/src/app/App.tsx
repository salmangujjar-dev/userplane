/**
 * App - Location router
 * Reads current Zendesk location from ZAF client context and renders the appropriate component
 */

import { Component, type ReactNode, useEffect, useState } from 'react';

import { initApiClient } from '@/api/client';

import { useClient } from './hooks/useClient';
import { TicketSidebar } from './locations/TicketSidebar';
import { TopBar } from './locations/TopBar';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '16px', textAlign: 'center', fontSize: '13px' }}>
          <p style={{ color: '#2f3941', marginBottom: '12px' }}>
            Something went wrong. Please reload.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              background: '#000',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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

  const content = (() => {
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
  })();

  return <ErrorBoundary>{content}</ErrorBoundary>;
}
