'use client';

import { Button } from '@workspace/ui/components/button';
import { RecordingPreview } from './recording-preview';

interface RecordingsSectionProps {
  title: string;
  description: string;
  count: number;
  onSeeMore?: () => void;
  recordingIds?: string[];
}

export function RecordingsSection({
  title,
  description,
  count,
  onSeeMore,
  recordingIds,
}: RecordingsSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {onSeeMore && (
          <Button variant="secondary" size="sm" className="rounded-lg" onClick={onSeeMore}>
            See More
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(count)].map((_, i) => (
          <RecordingPreview key={i} recordingId={recordingIds?.[i] || `rec-${i + 1}`} />
        ))}
      </div>
    </div>
  );
}
