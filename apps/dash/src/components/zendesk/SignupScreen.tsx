import { SUPPORT_EMAIL_MAILTO } from '@userplane/shared';

import { UserplaneIcon } from './Icons';
import { ScreenHeader } from './ScreenHeader';

interface SignupScreenProps {
  agentEmail: string | null;
  dashboardUrl: string;
}

export function SignupScreen({ agentEmail, dashboardUrl }: SignupScreenProps) {
  const description = agentEmail
    ? `Sign up with ${agentEmail} to get started`
    : 'Create an account to start requesting screen recordings';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ScreenHeader
        icon={<UserplaneIcon size={40} />}
        title="Welcome to Userplane"
        description={description}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <a
          href={`${dashboardUrl}/auth`}
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
          Sign up for Userplane
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
