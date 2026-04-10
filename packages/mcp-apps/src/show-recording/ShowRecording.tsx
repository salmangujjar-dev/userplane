import type { App } from '@modelcontextprotocol/ext-apps';

import { RecordingTabs } from './RecordingTabs';
import type { ShowRecordingData } from './types';
import { VideoPlayer } from './VideoPlayer';

interface ShowRecordingProps {
  app: App;
  data: ShowRecordingData;
}

export function ShowRecording({ app, data }: ShowRecordingProps) {
  const { recording, resources } = data;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Video player — top section */}
      <div className="shrink-0">
        <VideoPlayer
          app={app}
          videoUrl={resources.video.url}
          thumbnailUrl={resources.thumbnail.url}
          durationMs={recording.recordingDurationMs}
          workspaceId={data.workspaceId}
          recordingId={recording.recordingId}
        />
      </div>

      {/* Tabbed panel — bottom section, scrollable */}
      <div className="flex-1 overflow-hidden">
        <RecordingTabs recording={recording} resources={resources} />
      </div>
    </div>
  );
}
