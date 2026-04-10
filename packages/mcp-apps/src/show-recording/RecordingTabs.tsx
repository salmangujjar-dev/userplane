import type { App } from '@modelcontextprotocol/ext-apps';
import { useCallback, useRef, useState } from 'react';

import { LoadingState, Tabs, TabsContent, TabsList, TabsTrigger } from '../shared/components';
import { ActionsTab } from './ActionsTab';
import { ConsoleTab } from './ConsoleTab';
import { InfoTab } from './InfoTab';
import { NetworkTab } from './NetworkTab';
import type {
  ActionLogEntry,
  ConsoleLogEntry,
  NetworkLogEntry,
  RecordingDetail,
  RecordingResources,
} from './types';

interface RecordingTabsProps {
  app: App;
  recording: RecordingDetail;
  resources: RecordingResources;
  workspaceId: string;
}

/**
 * Derive the recording start time for log timestamp alignment.
 * Prefer the explicit recordingStartedAt stored during upload.
 * Fall back to createdAt - durationMs for older recordings (approximate).
 */
function getRecordingStartTime(recording: RecordingDetail): number | undefined {
  if (recording.recordingStartedAt) {
    return new Date(recording.recordingStartedAt).getTime();
  }
  if (recording.meta.createdAt) {
    return new Date(recording.meta.createdAt).getTime() - recording.recordingDurationMs;
  }
  return undefined;
}

type LogData<T> = { data: T[] | null; loading: boolean; error: string | null };

/**
 * Fetch log data via the MCP server tool channel.
 * Workaround for Claude.ai CSP blocking fetch() to R2 domains.
 */
async function fetchLogViaTool<T>(
  app: App,
  workspaceId: string,
  recordingId: string,
  resourceType: 'consoleLog' | 'networkLog' | 'action'
): Promise<T[]> {
  const result = await app.callServerTool({
    name: 'userplane_app_fetch_resource',
    arguments: { workspaceId, recordingId, resourceType },
  });

  const textContent = result.content?.find((c: { type: string }) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') throw new Error('No text content');

  const data = JSON.parse(textContent.text);
  if (data.error) throw new Error(data.error);
  if (!data.json) throw new Error('No data returned');

  return Array.isArray(data.json) ? data.json : [];
}

export function RecordingTabs({ app, recording, resources, workspaceId }: RecordingTabsProps) {
  const recordingStartTime = getRecordingStartTime(recording);
  const recordingId = recording.recordingId;

  // Lazy-loaded log data — fetched via MCP tool channel when tab is first activated
  const [consoleLogs, setConsoleLogs] = useState<LogData<ConsoleLogEntry>>({
    data: null,
    loading: false,
    error: null,
  });
  const [networkLogs, setNetworkLogs] = useState<LogData<NetworkLogEntry>>({
    data: null,
    loading: false,
    error: null,
  });
  const [actionLogs, setActionLogs] = useState<LogData<ActionLogEntry>>({
    data: null,
    loading: false,
    error: null,
  });

  // Track which tabs have been loaded
  const loaded = useRef<Set<string>>(new Set());

  const fetchLogData = useCallback(
    async <T,>(
      resourceType: 'consoleLog' | 'networkLog' | 'action',
      setter: React.Dispatch<React.SetStateAction<LogData<T>>>
    ) => {
      setter((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const data = await fetchLogViaTool<T>(app, workspaceId, recordingId, resourceType);
        setter({ data, loading: false, error: null });
      } catch (err) {
        setter({ data: null, loading: false, error: String(err) });
      }
    },
    [app, workspaceId, recordingId]
  );

  const handleTabChange = useCallback(
    (tab: string) => {
      if (loaded.current.has(tab)) return;
      loaded.current.add(tab);

      switch (tab) {
        case 'console':
          if (resources.consoleLog.url) fetchLogData<ConsoleLogEntry>('consoleLog', setConsoleLogs);
          else setConsoleLogs({ data: [], loading: false, error: null });
          break;
        case 'network':
          if (resources.networkLog.url) fetchLogData<NetworkLogEntry>('networkLog', setNetworkLogs);
          else setNetworkLogs({ data: [], loading: false, error: null });
          break;
        case 'actions':
          if (resources.action.url) fetchLogData<ActionLogEntry>('action', setActionLogs);
          else setActionLogs({ data: [], loading: false, error: null });
          break;
      }
    },
    [resources, fetchLogData]
  );

  return (
    <Tabs defaultValue="info" onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="info">Info</TabsTrigger>
        <TabsTrigger value="console">Console</TabsTrigger>
        <TabsTrigger value="network">Network</TabsTrigger>
        <TabsTrigger value="actions">Actions</TabsTrigger>
      </TabsList>

      <div>
        <TabsContent value="info">
          <InfoTab recording={recording} />
        </TabsContent>

        <TabsContent value="console">
          {consoleLogs.loading ? (
            <LoadingState message="Loading console logs..." />
          ) : consoleLogs.error ? (
            <ErrorState message={consoleLogs.error} />
          ) : (
            <ConsoleTab data={consoleLogs.data ?? []} recordingStartTime={recordingStartTime} />
          )}
        </TabsContent>

        <TabsContent value="network">
          {networkLogs.loading ? (
            <LoadingState message="Loading network logs..." />
          ) : networkLogs.error ? (
            <ErrorState message={networkLogs.error} />
          ) : (
            <NetworkTab data={networkLogs.data ?? []} recordingStartTime={recordingStartTime} />
          )}
        </TabsContent>

        <TabsContent value="actions">
          {actionLogs.loading ? (
            <LoadingState message="Loading actions..." />
          ) : actionLogs.error ? (
            <ErrorState message={actionLogs.error} />
          ) : (
            <ActionsTab data={actionLogs.data ?? []} recordingStartTime={recordingStartTime} />
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <p className="text-sm font-medium text-destructive mb-1">Failed to load data</p>
      <p className="text-xs text-muted-foreground max-w-xs">{message}</p>
    </div>
  );
}
