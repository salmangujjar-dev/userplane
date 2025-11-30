interface RecordingPlayerProps {
  recordingId?: string;
  onPlay?: () => void;
}

export function RecordingPlayer({ recordingId, onPlay }: RecordingPlayerProps) {
  return (
    <div className="relative w-full h-[calc(100vh-8rem)] rounded-2xl bg-muted p-4 flex items-center justify-center">
      <div className="relative w-full aspect-video">
        <iframe
          className="w-full h-full rounded-xl"
          src="https://www.youtube.com/embed/dQw4w9WgXcQ"
          title="Recording Player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
