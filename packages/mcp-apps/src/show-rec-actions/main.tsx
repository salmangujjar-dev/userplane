import '../ui/styles.css';

import { App } from '@modelcontextprotocol/ext-apps';
import { createRoot } from 'react-dom/client';

import { ActionsTab } from '../components/recording/ActionsTab';
import type { ActionLogEntry } from '../components/recording/types';
import { EmptyState, LoadingState } from '../components/shared';
import { MousePointer2Icon } from '../components/shared/icons';
import { setupThemeSync } from '../ui/theme';
import { extractJsonFromResult, fetchLogViaTool } from '../utils/extract-json';

const app = new App({ name: 'Userplane User Actions', version: '1.0.0' });
const root = createRoot(document.getElementById('root')!);

root.render(<LoadingState message="Loading user actions..." />);

app.connect();
setupThemeSync(app);

/** Data shape returned by the userplane_show_rec_actions tool. */
interface ShowRecActionsData {
  workspaceId: string;
  recordingId: string;
  recordingStartTime?: number;
  resourceType: 'action';
  resourceAvailable: boolean;
}

function isShowRecActionsData(data: unknown): data is ShowRecActionsData {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.workspaceId === 'string' && typeof obj.recordingId === 'string';
}

app.ontoolresult = async (result) => {
  try {
    const data = extractJsonFromResult(result);

    if (!isShowRecActionsData(data)) {
      root.render(
        <div className="p-4 text-xs font-mono whitespace-pre-wrap break-all">
          <p className="font-bold mb-2">Debug: unexpected tool result shape</p>
          <p className="mt-2">{JSON.stringify(data, null, 2).slice(0, 500)}</p>
        </div>
      );
      return;
    }

    if (!data.resourceAvailable) {
      root.render(
        <EmptyState
          icon={MousePointer2Icon}
          title="No user actions"
          description="Action capture was not enabled for this recording."
        />
      );
      return;
    }

    // Fetch log data via app-only tool channel (bypasses 25K token limit)
    const entries = await fetchLogViaTool<ActionLogEntry>(
      app,
      data.workspaceId,
      data.recordingId,
      'action'
    );

    root.render(<ActionsTab data={entries} recordingStartTime={data.recordingStartTime} />);
  } catch (err) {
    root.render(
      <div className="flex items-center justify-center min-h-[200px] p-8 text-center">
        <div>
          <p className="text-sm font-medium text-destructive mb-2">Failed to load</p>
          <p className="text-xs text-muted-foreground max-w-md wrap-break-word">{String(err)}</p>
        </div>
      </div>
    );
  }
};
