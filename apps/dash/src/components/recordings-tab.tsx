'use client';

import { RecordingsSection } from './recordings-section';

interface RecordingsTabProps {
  onSeeMore?: () => void;
  yourRecordingIds?: string[];
  recentRecordingIds?: string[];
}

export function RecordingsTab({
  onSeeMore,
  yourRecordingIds,
  recentRecordingIds,
}: RecordingsTabProps) {
  return (
    <div className="space-y-8">
      <RecordingsSection
        title="Your recordings"
        description="View received recordings"
        count={5}
        onSeeMore={onSeeMore}
        recordingIds={yourRecordingIds}
      />
      <RecordingsSection
        title="Recent recordings"
        description="View recent recordings"
        count={10}
        onSeeMore={onSeeMore}
        recordingIds={recentRecordingIds}
      />
    </div>
  );
}
