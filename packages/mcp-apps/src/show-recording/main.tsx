import '../shared/styles.css';

import { App } from '@modelcontextprotocol/ext-apps';
import { createRoot } from 'react-dom/client';

import { LoadingState } from '../shared/components';
import { setupThemeSync } from '../shared/theme';
import { ShowRecording } from './ShowRecording';
import type { ShowRecordingData } from './types';

const app = new App({ name: 'Userplane Recording Viewer', version: '1.0.0' });

const root = createRoot(document.getElementById('root')!);

// Show loading state while waiting for tool result
root.render(<LoadingState message="Loading recording..." />);

app.connect();
setupThemeSync(app);

// Receive tool result when the host pushes it after calling userplane_show_recording
app.ontoolresult = (result) => {
  try {
    const textContent = result.content?.find((c: { type: string }) => c.type === 'text');
    if (!textContent || textContent.type !== 'text')
      throw new Error('No text content in tool result');
    const text = textContent.text;

    const data: ShowRecordingData = JSON.parse(text);
    root.render(<ShowRecording app={app} data={data} />);
  } catch (err) {
    root.render(
      <div className="flex items-center justify-center h-screen p-8 text-center">
        <div>
          <p className="text-sm font-medium text-destructive mb-2">Failed to load recording</p>
          <p className="text-xs text-muted-foreground">{String(err)}</p>
        </div>
      </div>
    );
  }
};
