import '../shared/styles.css';

import { App } from '@modelcontextprotocol/ext-apps';
import { createRoot } from 'react-dom/client';

import { LoadingState } from '../shared/components';
import { setupThemeSync } from '../shared/theme';
import { ShowRecording } from './ShowRecording';
import type { ShowRecordingData } from './types';

const app = new App({ name: 'Userplane Preview', version: '1.0.0' });

const root = createRoot(document.getElementById('root')!);

// Show loading state while waiting for tool result
root.render(<LoadingState message="Loading..." />);

app.connect();
setupThemeSync(app);

/**
 * Extract JSON from a tool result's text content blocks.
 * Tries direct JSON.parse first, then looks for embedded JSON if the host
 * wrapped the text with a prefix.
 */
function extractJsonFromResult(result: {
  content?: Array<{ type: string; text?: string }>;
}): unknown {
  const textBlocks = (result.content ?? []).filter(
    (c): c is { type: 'text'; text: string } => c.type === 'text' && typeof c.text === 'string'
  );

  if (textBlocks.length === 0) throw new Error('No text content in tool result');

  for (let i = textBlocks.length - 1; i >= 0; i--) {
    const text = textBlocks[i]!.text;
    try {
      return JSON.parse(text);
    } catch {
      const jsonStart = text.indexOf('{');
      if (jsonStart >= 0) {
        try {
          return JSON.parse(text.slice(jsonStart));
        } catch {
          /* continue */
        }
      }
    }
  }

  throw new Error(textBlocks[textBlocks.length - 1]!.text);
}

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
          <p className="text-xs text-muted-foreground max-w-md break-words">{String(err)}</p>
        </div>
      </div>
    );
  }
};
