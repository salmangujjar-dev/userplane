'use client';

/**
 * Client component for the Zendesk iframe app.
 * Handles ZAF initialization, location routing, and the OAuth popup setup screen.
 * Config (apiToken, workspaceId) is passed from the server component.
 */

import { useCallback, useEffect, useState } from 'react';

import { ClientProvider } from '@/components/zendesk/ClientProvider';
import { UserplaneIcon } from '@/components/zendesk/Icons';
import { ScreenHeader } from '@/components/zendesk/ScreenHeader';
import { TicketSidebar } from '@/components/zendesk/TicketSidebar';
import { TopBar } from '@/components/zendesk/TopBar';
import { useZendeskClient } from '@/hooks/zendesk/use-client';
import { initZendeskApiClient } from '@/lib/zendesk/api-client';

interface ZendeskAppProps {
  config: { apiToken: string; workspaceId: string; subdomain: string } | null;
  subdomain: string | null;
  apiUrl: string;
  dashboardUrl: string;
}

export function ZendeskApp({ config, subdomain, apiUrl, dashboardUrl }: ZendeskAppProps) {
  return (
    <ClientProvider>
      <ZendeskAppInner
        config={config}
        subdomain={subdomain}
        apiUrl={apiUrl}
        dashboardUrl={dashboardUrl}
      />
    </ClientProvider>
  );
}

function ZendeskAppInner({ config, subdomain, apiUrl, dashboardUrl }: ZendeskAppProps) {
  const client = useZendeskClient();
  const [location, setLocation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch location + resize for ALL views (setup, loading, app).
  // This runs once on mount regardless of config, so every state gets proper sizing.
  useEffect(() => {
    let sizeForReactivation: { width: string; height: string } | null = null;

    client
      .context()
      .then((ctx) => {
        setLocation(ctx.location);
        const size =
          ctx.location === 'top_bar'
            ? { width: '380px', height: '450px' }
            : { width: '100%', height: '400px' };
        sizeForReactivation = size;
        client.invoke('resize', size);
      })
      .catch(() => setError('Failed to initialize app.'));

    const handleActivated = () => {
      if (sizeForReactivation) client.invoke('resize', sizeForReactivation);
    };
    client.on('app.activated', handleActivated);

    return () => {
      client.off('app.activated', handleActivated);
    };
  }, [client]);

  // Initialize API client when config is available
  useEffect(() => {
    if (config) {
      initZendeskApiClient(config.apiToken, apiUrl);
    }
  }, [config, apiUrl]);

  if (!config) {
    return <SetupScreen subdomain={subdomain} dashboardUrl={dashboardUrl} />;
  }

  if (error) {
    return <div style={{ padding: '16px', color: '#cc3340', fontSize: '13px' }}>{error}</div>;
  }

  if (!location) {
    return <div style={{ padding: '16px', textAlign: 'center', color: '#68737d' }}>Loading...</div>;
  }

  switch (location) {
    case 'ticket_sidebar':
    case 'new_ticket_sidebar':
      return <TicketSidebar workspaceId={config.workspaceId} dashboardUrl={dashboardUrl} />;
    case 'top_bar':
      return <TopBar workspaceId={config.workspaceId} dashboardUrl={dashboardUrl} />;
    default:
      return (
        <div style={{ padding: '16px', color: '#68737d', fontSize: '13px' }}>
          Unsupported location: {location}
        </div>
      );
  }
}

type SetupView = 'connect' | 'waiting';

function SetupScreen({
  subdomain,
  dashboardUrl,
}: {
  subdomain: string | null;
  dashboardUrl: string;
}) {
  const [view, setView] = useState<SetupView>('connect');

  const handleConnect = useCallback(() => {
    const params = new URLSearchParams({ mode: 'popup' });
    if (subdomain) params.set('subdomain', subdomain);
    window.open(
      `${dashboardUrl}/oauth/zendesk/authorize?${params.toString()}`,
      'userplane-oauth',
      'width=500,height=650'
    );
    setView('waiting');
  }, [subdomain, dashboardUrl]);

  if (view === 'waiting') {
    return (
      <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <ScreenHeader
          icon={<UserplaneIcon size={40} />}
          title="Complete sign-in"
          description="Finish connecting in the popup window. Once done, this app will refresh automatically."
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => window.location.reload()}
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
            Refresh
          </button>
          <button
            onClick={() => setView('connect')}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              background: 'white',
              color: '#2f3941',
              border: '1px solid #d8dcde',
            }}
          >
            Back
          </button>
        </div>

        <p style={{ fontSize: '11px', color: '#87929d', textAlign: 'center', lineHeight: 1.4 }}>
          Popup didn&apos;t open? Check your browser&apos;s popup blocker.
        </p>
      </div>
    );
  }

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
    </div>
  );
}
