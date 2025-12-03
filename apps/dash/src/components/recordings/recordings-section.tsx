'use client';

import { RecordingPreview } from './recording-preview';
import { ChevronRight } from 'lucide-react';

interface RecordingsSectionProps {
  title: string;
  description: string;
  count: number;
  onSeeMore?: () => void;
  recordingIds?: string[];
  createdBy?: string;
}

export function RecordingsSection({
  title,
  description,
  count,
  onSeeMore,
  recordingIds,
  createdBy,
}: RecordingsSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(count - 1)].map((_, i) => (
          <RecordingPreview
            key={i}
            recordingId={recordingIds?.[i] || `rec-${i + 1}`}
            createdBy={createdBy}
          />
        ))}
        {onSeeMore && (
          <button
            onClick={onSeeMore}
            className="group relative aspect-video w-full overflow-hidden rounded-lg border-2 border-dashed border-border bg-transparent hover:bg-accent/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2"
          >
            <span className="text-sm font-medium text-foreground">See More</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        )}
      </div>
    </div>
  );
}
