/**
 * App - Location router
 * Reads server-injected config from window.__ZENDESK_CONFIG__ and renders the appropriate component.
 * If not connected, shows a setup screen with an in-app OAuth popup flow.
 */

import { Component, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { initApiClient } from '@/api/client';
import { getZendeskConfig, isConfigured } from '@/lib/config';
import { DASHBOARD_URL } from '@/lib/constants';

import { UserplaneIcon } from './components/Icons';
import { ScreenHeader } from './components/ScreenHeader';
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

  const windowConfig = getZendeskConfig();

  // Narrow: if configured, extract the typed config for use in the effect
  const appConfig = isConfigured(windowConfig) ? windowConfig : null;

  useEffect(() => {
    if (!appConfig) return;

    const { apiToken, workspaceId: wsId } = appConfig;

    initApiClient(apiToken);
    setWorkspaceId(wsId);

    client
      .context()
      .then((ctx) => setLocation(ctx.location))
      .catch(() => setError('Failed to initialize app.'));
  }, [client, appConfig]);

  if (!appConfig) {
    return <SetupScreen subdomain={windowConfig.subdomain} />;
  }

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

/**
 * Setup screen shown when no integration exists for this Zendesk instance.
 * Opens a popup to the dashboard OAuth authorize page.
 * After OAuth completes, the popup sends a postMessage and we reload the iframe.
 */
function SetupScreen({ subdomain }: { subdomain: string | null }) {
  const popupRef = useRef<Window | null>(null);

  const handleConnect = useCallback(() => {
    const params = new URLSearchParams({ mode: 'popup' });
    if (subdomain) params.set('subdomain', subdomain);
    popupRef.current = window.open(
      `${DASHBOARD_URL}/oauth/zendesk/authorize?${params.toString()}`,
      'userplane-oauth',
      'width=500,height=650'
    );
  }, [subdomain]);

  // Listen for OAuth completion from the popup
  useEffect(() => {
    const dashboardOrigin = new URL(DASHBOARD_URL).origin;

    function onMessage(event: MessageEvent) {
      if (event.origin !== dashboardOrigin) return;
      if (event.data?.type === 'zendesk-oauth-complete') {
        // Integration created — reload iframe to pick up server-injected token
        window.location.reload();
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <ScreenHeader
        icon={<UserplaneIcon size={40} />}
        title="Connect to Userplane"
        description="Sign in with your Userplane account to start requesting screen recordings from tickets."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={handleConnect}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
            background: '#000',
            color: 'white',
            border: 'none',
          }}
        >
          Connect to Userplane
        </button>
      </div>

      <p style={{ fontSize: '11px', color: '#87929d', textAlign: 'center', lineHeight: 1.4 }}>
        A popup will open to sign in. Once connected, this app will load automatically.
      </p>
    </div>
  );
}
