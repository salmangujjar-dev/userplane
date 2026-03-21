/**
 * App - Location router
 * Reads current Zendesk location from ZAF client context and renders the appropriate component.
 * Initializes the API client with ZAF secure proxy and fetches workspace context from /me.
 */

import { Component, type ReactNode, useCallback, useEffect, useState } from 'react';

import { ApiError, initApiClient } from '@/api/client';

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
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const init = useCallback(async () => {
    try {
      setError(null);
      setNeedsSetup(false);

      // Initialize API client with ZAF client (uses secure proxy for auth)
      const api = initApiClient(client);

      // Get context early so we have the subdomain for the setup screen
      const ctx = await client.context();
      setSubdomain(((ctx as Record<string, unknown>).subdomain as string) ?? null);

      // Fetch workspace context from /me endpoint
      // The token is injected by Zendesk's proxy — we never see it
      const me = await api.getMe();
      setWorkspaceId(me.data.workspaceId);
      setLocation(ctx.location);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // OAuth not completed — show setup screen
        setNeedsSetup(true);
      } else {
        setError('Failed to initialize app.');
      }
    }
  }, [client]);

  useEffect(() => {
    init();
  }, [init]);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    await init();
    setRetrying(false);
  }, [init]);

  if (needsSetup) {
    return <SetupScreen subdomain={subdomain} onRetry={handleRetry} retrying={retrying} />;
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
 * Setup screen shown when OAuth is not completed or the integration is disconnected.
 * Directs the admin to the app settings page where they can authorize via the built-in OAuth flow.
 */
function SetupScreen({
  subdomain,
  onRetry,
  retrying,
}: {
  subdomain: string | null;
  onRetry: () => void;
  retrying: boolean;
}) {
  const settingsUrl = subdomain
    ? `https://${subdomain}.zendesk.com/admin/apps-integrations/apps/support-apps`
    : null;

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <ScreenHeader
        icon={<UserplaneIcon size={40} />}
        title="Connect to Userplane"
        description="Sign in with your Userplane account to start requesting screen recordings from tickets."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {settingsUrl ? (
          <a
            href={settingsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              background: '#000',
              color: 'white',
              border: 'none',
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            Open App Settings
          </a>
        ) : (
          <p style={{ fontSize: '12px', color: '#68737d', textAlign: 'center' }}>
            Go to <strong>Admin Center &rarr; Apps &rarr; Userplane &rarr; Change Settings</strong>{' '}
            to sign in.
          </p>
        )}

        <button
          onClick={onRetry}
          disabled={retrying}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: retrying ? 'default' : 'pointer',
            fontSize: '12px',
            background: 'white',
            color: '#2f3941',
            border: '1px solid #d8dcde',
            opacity: retrying ? 0.6 : 1,
          }}
        >
          {retrying ? 'Checking...' : 'I\u2019ve connected \u2014 retry'}
        </button>
      </div>

      <p style={{ fontSize: '11px', color: '#87929d', textAlign: 'center', lineHeight: 1.4 }}>
        After signing in via app settings, come back here and click retry.
      </p>
    </div>
  );
}
