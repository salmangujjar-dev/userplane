import { SUPPORT_EMAIL_MAILTO } from '@userplane/shared';

import { LockIcon } from './Icons';
import { ScreenHeader } from './ScreenHeader';

interface AccessRequestedScreenProps {
  agentEmail: string | null;
  dashboardUrl: string;
}

export function AccessRequestedScreen({ agentEmail, dashboardUrl }: AccessRequestedScreenProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ScreenHeader
        icon={<LockIcon size={40} />}
        title="You don't have access"
        description="Contact your administrator to get started with Userplane."
      />

      {agentEmail && (
        <div style={{ fontSize: '12px', color: '#68737d', textAlign: 'center' }}>
          Signed in as <strong>{agentEmail}</strong>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <a
          href={`${dashboardUrl}/workspace/suggest`}
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
          Request Access
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
