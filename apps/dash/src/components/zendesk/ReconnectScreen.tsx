import { SUPPORT_EMAIL_MAILTO } from '@userplane/shared';

import { UserplaneIcon } from './Icons';
import { ScreenHeader } from './ScreenHeader';

interface ReconnectScreenProps {
  agentEmail: string | null;
  workspaceId: string;
  dashboardUrl: string;
}

export function ReconnectScreen({ agentEmail, workspaceId, dashboardUrl }: ReconnectScreenProps) {
  const settingsUrl = `${dashboardUrl}/workspace/${workspaceId}/settings?tab=integrations`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ScreenHeader
        icon={<UserplaneIcon size={40} />}
        title="Reconnect Zendesk"
        description="Your Zendesk integration needs to be reconnected to continue."
      />

      {agentEmail && (
        <div style={{ fontSize: '12px', color: '#68737d', textAlign: 'center' }}>
          Signed in as <strong>{agentEmail}</strong>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
            boxSizing: 'border-box',
          }}
        >
          Reconnect
        </a>
        <a
          href={SUPPORT_EMAIL_MAILTO}
          style={{
            display: 'block',
            width: '100%',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            background: 'white',
            color: '#2f3941',
            border: '1px solid #d8dcde',
            textAlign: 'center',
            textDecoration: 'none',
            boxSizing: 'border-box',
          }}
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}
