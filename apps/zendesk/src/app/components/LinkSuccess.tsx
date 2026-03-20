interface LinkSuccessAction {
  label: string;
  onClick: () => void;
  variant: 'primary' | 'secondary' | 'ghost';
}

interface LinkSuccessProps {
  linkUrl: string;
  actions: LinkSuccessAction[];
}

const variantStyles: Record<LinkSuccessAction['variant'], React.CSSProperties> = {
  primary: {
    background: '#1f73b7',
    color: 'white',
    border: 'none',
  },
  secondary: {
    background: 'white',
    color: '#1f73b7',
    border: '1px solid #1f73b7',
  },
  ghost: {
    background: 'white',
    color: '#2f3941',
    border: '1px solid #d8dcde',
  },
};

export function LinkSuccess({ linkUrl, actions }: LinkSuccessProps) {
  return (
    <div>
      <div
        style={{
          padding: '12px',
          background: '#edf8f4',
          borderRadius: '4px',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            color: '#038153',
            marginBottom: '8px',
            fontWeight: 500,
          }}
        >
          Link created
        </div>
        <div
          style={{
            padding: '6px 8px',
            background: 'white',
            borderRadius: '4px',
            fontSize: '12px',
            wordBreak: 'break-all',
            border: '1px solid #d1e8df',
          }}
        >
          {linkUrl}
        </div>
      </div>

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
