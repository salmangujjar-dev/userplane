import type { ReactNode } from 'react';

interface ScreenHeaderProps {
  icon: ReactNode;
  title: string;
  description?: string;
}

export function ScreenHeader({ icon, title, description }: ScreenHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '8px',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#2f3941' }}>{title}</div>
      {description && (
        <div style={{ fontSize: '12px', color: '#68737d', lineHeight: 1.4 }}>{description}</div>
      )}
    </div>
  );
}
