interface OpenerViewProps {
  onRequestRecording: () => void;
  onViewRecordings: () => void;
}

export function OpenerView({ onRequestRecording, onViewRecordings }: OpenerViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <button
        onClick={onRequestRecording}
        style={{
          width: '100%',
          padding: '10px 16px',
          background: '#1f73b7',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
        }}
      >
        Request screen recording
      </button>
      <button
        onClick={onViewRecordings}
        style={{
          width: '100%',
          padding: '10px 16px',
          background: 'white',
          color: '#1f73b7',
          border: '1px solid #1f73b7',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
        }}
      >
        View recordings
      </button>
    </div>
  );
}
