import '../utils/zod-jitless';
import '../ui/styles.css';

import { App } from '@modelcontextprotocol/ext-apps';
import { createRoot } from 'react-dom/client';

import type { ShowRecordingData } from '../components/recording/types';
import { LoadingState } from '../components/shared';
import { setupThemeSync } from '../ui/theme';
import { extractJsonFromResult } from '../utils/extract-json';
import { ShowRecording } from './ShowRecording';

const app = new App({ name: 'Userplane Preview', version: '1.0.0' });

const root = createRoot(document.getElementById('root')!);

// Show loading state while waiting for tool result
root.render(<LoadingState message="Loading..." />);

app.connect();
setupThemeSync(app);

function isShowRecordingData(data: unknown): data is ShowRecordingData {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.recording === 'object' && obj.recording !== null;
}

// Receive tool result from the host and render the show-recording view.
app.ontoolresult = (result) => {
  try {
    const data = extractJsonFromResult(result);

    if (isShowRecordingData(data)) {
      root.render(<ShowRecording app={app} data={data} />);
    } else {
      root.render(
        <div className="p-4 text-xs font-mono whitespace-pre-wrap break-all">
          <p className="font-bold mb-2">Debug: unexpected tool result shape</p>
          <p className="mt-2">{JSON.stringify(data, null, 2).slice(0, 500)}</p>
        </div>
      );
    }
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
