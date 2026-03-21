import { useState } from 'react';

import { SuccessIcon } from './Icons';
import { ScreenHeader } from './ScreenHeader';

interface LinkSuccessAction {
  label: string;
  onClick: () => void;
  variant: 'primary' | 'secondary';
}

interface LinkSuccessProps {
  linkUrl: string;
  description: string;
  actions: LinkSuccessAction[];
}

const variantStyles: Record<LinkSuccessAction['variant'], React.CSSProperties> = {
  primary: {
    background: '#000',
    color: 'white',
    border: 'none',
  },
  secondary: {
    background: 'white',
    color: '#2f3941',
    border: '1px solid #d8dcde',
  },
};

export function LinkSuccess({ linkUrl, description, actions }: LinkSuccessProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(linkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ScreenHeader
        icon={<SuccessIcon size={40} />}
        title="Recording link created"
        description={description}
      />

      <button
        onClick={handleCopy}
        style={{
          display: 'block',
          width: '100%',
          padding: '8px 10px',
          background: '#f8f9f9',
          borderRadius: '4px',
          fontSize: '12px',
          border: '1px solid #d8dcde',
          cursor: 'pointer',
          color: copied ? '#038153' : '#2f3941',
          textAlign: 'left',
          transition: 'color 0.15s',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={linkUrl}
      >
        {copied ? 'Copied!' : linkUrl}
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: action.variant === 'primary' ? 500 : undefined,
              ...variantStyles[action.variant],
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
