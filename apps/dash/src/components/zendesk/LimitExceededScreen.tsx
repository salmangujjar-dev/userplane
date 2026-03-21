import { UpgradeIcon } from './Icons';
import { ScreenHeader } from './ScreenHeader';

interface LimitExceededScreenProps {
  workspaceId: string;
  dashboardUrl: string;
  onGoBack: () => void;
}

export function LimitExceededScreen({
  workspaceId,
  dashboardUrl,
  onGoBack,
}: LimitExceededScreenProps) {
  const upgradeUrl = `${dashboardUrl}/workspace/${workspaceId}/settings?tab=plan-usage&plan-modal=detailed`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ScreenHeader
        icon={<UpgradeIcon size={40} />}
        title="Limit Reached"
        description="You've reached the maximum number of recording links for your workspace."
      />

      <div style={{ fontSize: '12px', color: '#68737d', textAlign: 'center', lineHeight: 1.4 }}>
        Upgrade your workspace to continue creating recording links.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <a
          href={upgradeUrl}
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
          Upgrade Workspace
        </a>
        <button
          onClick={onGoBack}
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
          Go back
        </button>
      </div>
    </div>
  );
}
