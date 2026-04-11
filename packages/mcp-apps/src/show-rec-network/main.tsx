import '../ui/styles.css';

import { App } from '@modelcontextprotocol/ext-apps';
import { createRoot } from 'react-dom/client';

import { EmptyState, LoadingState } from '../components';
import { GlobeIcon } from '../components/icons';
import { NetworkTab } from '../recording/NetworkTab';
import type { NetworkLogEntry } from '../recording/types';
import { setupThemeSync } from '../ui/theme';
import { extractJsonFromResult, fetchLogViaTool } from '../utils/extract-json';

const app = new App({ name: 'Userplane Network Requests', version: '1.0.0' });
const root = createRoot(document.getElementById('root')!);

root.render(<LoadingState message="Loading network requests..." />);

app.connect();
setupThemeSync(app);

/** Data shape returned by the userplane_show_rec_network tool. */
interface ShowRecNetworkData {
  workspaceId: string;
  recordingId: string;
  recordingStartTime?: number;
  resourceType: 'networkLog';
  resourceAvailable: boolean;
}

function isShowRecNetworkData(data: unknown): data is ShowRecNetworkData {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.workspaceId === 'string' && typeof obj.recordingId === 'string';
}

app.ontoolresult = async (result) => {
  try {
    const data = extractJsonFromResult(result);

    if (!isShowRecNetworkData(data)) {
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
          icon={GlobeIcon}
          title="No network activity"
          description="Network log capture was not enabled for this recording."
        />
      );
      return;
    }

    // Fetch log data via app-only tool channel (bypasses 25K token limit)
    const entries = await fetchLogViaTool<NetworkLogEntry>(
      app,
      data.workspaceId,
      data.recordingId,
      'networkLog'
    );

    root.render(<NetworkTab data={entries} recordingStartTime={data.recordingStartTime} />);
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
