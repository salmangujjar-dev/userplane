import { RecordingPreview } from './recording-preview';

interface RecordingsGridProps {
  count: number;
  recordingIds?: string[];
}

export function RecordingsGrid({ count, recordingIds }: RecordingsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {[...Array(count)].map((_, i) => (
        <RecordingPreview key={i} recordingId={recordingIds?.[i] || `rec-${i + 1}`} />
      ))}
    </div>
  );
}
