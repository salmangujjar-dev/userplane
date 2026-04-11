import type { App } from '@modelcontextprotocol/ext-apps';

import type { ShowRecordingData } from '../recording/types';
import { RecordingTabs } from './RecordingTabs';
import { VideoPlayer } from './VideoPlayer';

interface ShowRecordingProps {
  app: App;
  data: ShowRecordingData;
}

export function ShowRecording({ app, data }: ShowRecordingProps) {
  const { recording, resources } = data;

  return (
    <div className="flex flex-col">
      {/* Video player — top section */}
      <div>
        <VideoPlayer
          thumbnailDataUri={data.thumbnailDataUri}
          dashboardUrl={data.dashboardUrl}
          durationMs={recording.recordingDurationMs}
        />
      </div>

      {/* Tabbed panel — bottom section */}
      <div className="min-h-[400px]">
        <RecordingTabs
          app={app}
          recording={recording}
          resources={resources}
          workspaceId={data.workspaceId}
        />
      </div>
    </div>
  );
}
