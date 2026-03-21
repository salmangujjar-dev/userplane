import { ErrorIcon } from './Icons';
import { ScreenHeader } from './ScreenHeader';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onGoBack?: () => void;
}

export function ErrorMessage({ message, onRetry, onGoBack }: ErrorMessageProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ScreenHeader
        icon={<ErrorIcon size={50} />}
        title="Something went wrong"
        description={message}
      />

      {(onRetry || onGoBack) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {onRetry && (
            <button
              onClick={onRetry}
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
              Try again
            </button>
          )}
          {onGoBack && (
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
          )}
        </div>
      )}
    </div>
  );
}
