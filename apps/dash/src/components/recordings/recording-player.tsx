interface RecordingPlayerProps {
  recordingId?: string;
  onPlay?: () => void;
}

export function RecordingPlayer({ recordingId, onPlay }: RecordingPlayerProps) {
  return (
    <div
      className="w-full aspect-video rounded-2xl bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
      onClick={onPlay}
    />
  );
}
