import { useState } from 'react';

import { RecordingIcon, RecordingsListIcon, UserplaneIcon } from './Icons';
import { ScreenHeader } from './ScreenHeader';

interface OpenerViewProps {
  onRequestRecording: () => void;
  onViewRecordings: () => void;
}

function MenuRow({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        padding: '10px 12px',
        border: '1px solid #d8dcde',
        borderRadius: '4px',
        background: hovered ? '#f8f9f9' : 'white',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div style={{ flexShrink: 0, width: 24, height: 24 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '13px', color: '#2f3941', fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: '12px', color: '#68737d', marginTop: '2px' }}>{subtitle}</div>
      </div>
    </button>
  );
}

export function OpenerView({ onRequestRecording, onViewRecordings }: OpenerViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ScreenHeader
        icon={<UserplaneIcon size={40} />}
        title="Userplane"
        description="Request and manage screen recordings"
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <MenuRow
          icon={<RecordingIcon size={24} />}
          title="Request screen recording"
          subtitle="Get a screen recording for troubleshooting"
          onClick={onRequestRecording}
        />
        <MenuRow
          icon={<RecordingsListIcon size={24} />}
          title="View recordings"
          subtitle="Review recordings to resolve issues"
          onClick={onViewRecordings}
        />
      </div>
    </div>
  );
}
