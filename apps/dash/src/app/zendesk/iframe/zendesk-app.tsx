'use client';

/**
 * Client component for the Zendesk iframe app.
 * Handles ZAF initialization, location routing, session auth, and the OAuth popup setup screen.
 *
 * Auth flow:
 * 1. Server component resolves config (workspaceId, subdomain) — NO static apiToken
 * 2. ZAF JWT session hook exchanges ZAF-signed JWT for short-lived session token
 * 3. Session token used for ORPC API calls (auto-refreshes every 12 min)
 */

import { useCallback, useEffect, useState } from 'react';

import { ClientProvider } from '@/components/zendesk/ClientProvider';
import { UserplaneIcon } from '@/components/zendesk/Icons';
import { ScreenHeader } from '@/components/zendesk/ScreenHeader';
import { TicketSidebar } from '@/components/zendesk/TicketSidebar';
import { TopBar } from '@/components/zendesk/TopBar';
import { useZendeskClient } from '@/hooks/zendesk/use-client';
import { ZendeskApiProvider } from '@/hooks/zendesk/use-zendesk-api';
import { useZendeskSession } from '@/hooks/zendesk/use-zendesk-session';

interface ZendeskAppProps {
  config: { workspaceId: string; subdomain: string } | null;
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

  // Session auth via ZAF JWT — only active when config is available
  const session = useZendeskSession(apiUrl, config?.workspaceId ?? '', config?.subdomain ?? '');

  // Fetch location + resize for ALL views (setup, loading, app).
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

  if (!config) {
    return <SetupScreen subdomain={subdomain} dashboardUrl={dashboardUrl} />;
  }

  if (error) {
    return <div style={{ padding: '16px', color: '#cc3340', fontSize: '13px' }}>{error}</div>;
  }

  if (!location || session.isLoading) {
    return <div style={{ padding: '16px', textAlign: 'center', color: '#68737d' }}>Loading...</div>;
  }

  if (session.error) {
    return (
      <div
        style={{
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <ScreenHeader
          icon={<UserplaneIcon size={40} />}
          title="Connection issue"
          description="Unable to authenticate with Userplane. Try reconnecting your account."
        />
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
          Retry
        </button>
        <p style={{ fontSize: '11px', color: '#87929d', lineHeight: 1.4 }}>
          If the issue persists, disconnect and reconnect from your Userplane workspace settings.
        </p>
      </div>
    );
  }

  if (!session.sessionToken) {
    return <div style={{ padding: '16px', textAlign: 'center', color: '#68737d' }}>Loading...</div>;
  }

  return (
    <ZendeskApiProvider sessionToken={session.sessionToken} apiUrl={apiUrl}>
      <div>
        {(() => {
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
        })()}
      </div>
    </ZendeskApiProvider>
  );
}

type SetupView = 'connect' | 'waiting';

function SetupScreen({
  subdomain,
  dashboardUrl,
}: {
  subdomain: string | null;
  dashboardUrl: string;
}) {
  const zafClient = useZendeskClient();
  const [view, setView] = useState<SetupView>('connect');

  const handleConnect = useCallback(async () => {
    const params = new URLSearchParams({ mode: 'popup' });
    if (subdomain) params.set('subdomain', subdomain);

    // Pass installationId so OAuth flow can set jwt_secret on the installation
    try {
      const metadata = await zafClient.metadata();
      if (metadata.installationId) {
        params.set('installationId', String(metadata.installationId));
      }
    } catch {
      // If metadata fails, proceed without installationId
    }

    window.open(
      `${dashboardUrl}/oauth/zendesk/authorize?${params.toString()}`,
      'userplane-oauth',
      'width=500,height=650'
    );
    setView('waiting');
  }, [subdomain, dashboardUrl, zafClient]);

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
