import { App } from '@modelcontextprotocol/ext-apps';
import type { ReactNode, SVGProps } from 'react';
import { createRoot } from 'react-dom/client';

import { EmptyState, LoadingState } from '../components/shared';
import { setupThemeSync } from '../ui/theme';
import { extractJsonFromResult, fetchLogViaTool } from './extract-json';

/** Payload shape emitted by the three focused-resource tools. */
interface FocusedResourceData {
  workspaceId: string;
  recordingId: string;
  recordingStartTime?: number;
  resourceAvailable: boolean;
}

function isFocusedResourceData(data: unknown): data is FocusedResourceData {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.workspaceId === 'string' &&
    typeof obj.recordingId === 'string' &&
    typeof obj.resourceAvailable === 'boolean'
  );
}

type IconComponent = (props: SVGProps<SVGSVGElement>) => ReactNode;

interface FocusedResourceWidgetConfig<Entry> {
  appName: string;
  appVersion: string;
  loadingMessage: string;
  resourceType: 'consoleLog' | 'networkLog' | 'action';
  emptyIcon: IconComponent;
  emptyTitle: string;
  emptyDescription: string;
  render: (entries: Entry[], recordingStartTime: number | undefined) => ReactNode;
}

/**
 * Boot a focused-resource widget: creates the MCP app, mounts the React root,
 * shows a loading state, waits for the tool result, fetches entries via the
 * app-only resource tool, then hands the rendered JSX to the caller.
 *
 * Shared by show-rec-console / show-rec-network / show-rec-actions — the three
 * widgets differ only in app identity, copy, and row rendering.
 */
export function bootstrapFocusedResourceWidget<Entry>(config: FocusedResourceWidgetConfig<Entry>) {
  const app = new App({ name: config.appName, version: config.appVersion });

  const container = document.getElementById('root');
  if (!container) throw new Error('mcp-apps: #root element missing from index.html');
  const root = createRoot(container);

  root.render(<LoadingState message={config.loadingMessage} />);
  app.connect();
  setupThemeSync(app);

  app.ontoolresult = async (result) => {
    try {
      const data = extractJsonFromResult(result);

      if (!isFocusedResourceData(data)) {
        root.render(<DebugFallback data={data} />);
        return;
      }

      if (!data.resourceAvailable) {
        root.render(
          <EmptyState
            icon={config.emptyIcon}
            title={config.emptyTitle}
            description={config.emptyDescription}
          />
        );
        return;
      }

      const entries = await fetchLogViaTool<Entry>(
        app,
        data.workspaceId,
        data.recordingId,
        config.resourceType
      );

      root.render(config.render(entries, data.recordingStartTime));
    } catch (err) {
      root.render(<ErrorFallback error={err} />);
    }
  };
}

function DebugFallback({ data }: { data: unknown }) {
  return (
    <div className="p-4 text-xs font-mono whitespace-pre-wrap break-all">
      <p className="font-bold mb-2">Debug: unexpected tool result shape</p>
      <p className="mt-2">{JSON.stringify(data, null, 2).slice(0, 500)}</p>
    </div>
  );
}

function ErrorFallback({ error }: { error: unknown }) {
  return (
    <div className="flex items-center justify-center min-h-[200px] p-8 text-center">
      <div>
        <p className="text-sm font-medium text-destructive mb-2">Failed to load</p>
        <p className="text-xs text-muted-foreground max-w-md wrap-break-word">{String(error)}</p>
      </div>
    </div>
  );
}
